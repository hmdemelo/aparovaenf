import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/db/database.types'
import type { Difficulty, SourceType } from '@/lib/validation/schemas'

/**
 * Feed question repository.
 *
 * Reads published questions for the student feed and grades answers. Feed
 * payloads never include the `is_correct` flag or alternative comments —
 * correctness is only revealed by {@link gradeAnswer} after an answer is
 * submitted, so the answer can't be scraped from the feed response.
 */

type Db = SupabaseClient<Database>

export type FeedAlternative = {
  id: string
  label: string
  text: string
  position: number
}

export type FeedSource = {
  type: SourceType
  orgao: string | null
  cargo: string | null
  year: number | null
  reference: string | null
}

export type FeedQuestion = {
  id: string
  statement: string
  difficulty: Difficulty
  career: { id: string; name: string; slug: string }
  subject: { name: string } | null
  board: { name: string } | null
  source: FeedSource | null
  annulled: boolean
  answerKeyChanged: boolean
  alternatives: FeedAlternative[]
  image_path: string | null
}

export type GradingResult = {
  isCorrect: boolean
  correctAlternativeId: string
  generalComment: string | null
  selectedAlternativeComment: string | null
}

async function resolveCareerId(db: Db, slug: string): Promise<string | null> {
  const { data } = await db
    .from('careers')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()
  return data?.id ?? null
}

async function resolveBoardId(db: Db, slug: string): Promise<string | null> {
  const { data } = await db
    .from('boards')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()
  return data?.id ?? null
}

/** Random published question id for a career (optionally a board), via the DB. */
async function pickRandomQuestionId(
  db: Db,
  params: { careerId: string; boardId: string | null; excludeIds: string[] },
): Promise<string | null> {
  const { data, error } = await db.rpc('next_feed_question', {
    p_career_id: params.careerId,
    p_board_id: params.boardId ?? undefined,
    p_exclude: params.excludeIds,
  })
  if (error || !data) return null
  return data as string
}

/**
 * Random published question id matching dynamic filters (subject and/or tags).
 * Selection happens in the app layer over an id-only candidate set so we don't
 * depend on a filtered RPC; the set is bounded by career + board + subject.
 */
async function pickFilteredQuestionId(
  db: Db,
  params: {
    careerId: string
    boardId: string | null
    subjectId: string | null
    tagIds: string[]
    excludeIds: string[]
  },
): Promise<string | null> {
  const hasTags = params.tagIds.length > 0
  let query = db
    .from('questions')
    .select(hasTags ? 'id, question_tags!inner(tag_id)' : 'id')
    .eq('status', 'published')
    .eq('career_id', params.careerId)
  if (params.boardId) query = query.eq('board_id', params.boardId)
  if (params.subjectId) query = query.eq('subject_id', params.subjectId)
  if (hasTags) query = query.in('question_tags.tag_id', params.tagIds)

  const { data, error } = await query.limit(500)
  if (error || !data) return null

  // The select string is built conditionally, so narrow the row shape here.
  const rows = data as unknown as Array<{ id: string }>
  const exclude = new Set(params.excludeIds)
  // Tag joins can repeat a question id (one row per matching tag) — dedupe.
  const ids = Array.from(new Set(rows.map((r) => r.id))).filter(
    (id) => !exclude.has(id),
  )
  if (ids.length === 0) return null
  return ids[Math.floor(Math.random() * ids.length)]
}

/**
 * Return the next eligible question for the feed, or null when no published
 * question matches the filters / all have been answered.
 */
export async function getNextQuestion(
  db: Db,
  params: {
    careerSlug: string
    boardSlug?: string
    subjectId?: string
    tagIds?: string[]
    excludeIds?: string[]
  },
): Promise<FeedQuestion | null> {
  const careerId = await resolveCareerId(db, params.careerSlug)
  if (!careerId) return null

  const boardId = params.boardSlug
    ? await resolveBoardId(db, params.boardSlug)
    : null

  const subjectId = params.subjectId ?? null
  const tagIds = params.tagIds ?? []
  const excludeIds = params.excludeIds ?? []
  const hasDynamicFilter = Boolean(subjectId) || tagIds.length > 0

  // Unfiltered feed uses the DB random-pick RPC; dynamic filters (subject/tags)
  // select in the app layer over an id-only candidate set.
  const pickedId = hasDynamicFilter
    ? await pickFilteredQuestionId(db, {
        careerId,
        boardId,
        subjectId,
        tagIds,
        excludeIds,
      })
    : await pickRandomQuestionId(db, { careerId, boardId, excludeIds })

  if (!pickedId) return null

  const { data, error } = await db
    .from('questions')
    .select(
      `id, statement, difficulty, source_type, source_orgao, source_cargo,
       source_year, source_reference, annulled, answer_key_changed, image_path,
       career:careers!inner(id, name, slug),
       subject:subjects(name),
       board:boards(name),
       alternatives(id, label, text, position)`,
    )
    .eq('id', pickedId)
    .single()

  if (error || !data) return null

  const career = Array.isArray(data.career) ? data.career[0] : data.career
  const subject = Array.isArray(data.subject) ? data.subject[0] : data.subject
  const board = Array.isArray(data.board) ? data.board[0] : data.board

  return {
    id: data.id,
    statement: data.statement,
    difficulty: data.difficulty as Difficulty,
    career: { id: career.id, name: career.name, slug: career.slug },
    subject: subject ? { name: subject.name } : null,
    board: board ? { name: board.name } : null,
    source:
      data.source_type === 'prova_oficial'
        ? {
            type: data.source_type as SourceType,
            orgao: data.source_orgao,
            cargo: data.source_cargo,
            year: data.source_year,
            reference: data.source_reference,
          }
        : null,
    annulled: data.annulled,
    answerKeyChanged: data.answer_key_changed,
    alternatives: (data.alternatives ?? [])
      .map((a) => ({
        id: a.id,
        label: a.label,
        text: a.text,
        position: a.position,
      }))
      .sort((a, b) => a.position - b.position),
    image_path: data.image_path,
  }
}

/**
 * Grade a submitted answer against the stored correct alternative and return
 * the comments to show. Does not persist anything.
 */
export async function gradeAnswer(
  db: Db,
  params: { questionId: string; selectedAlternativeId: string },
): Promise<GradingResult | null> {
  const { data: question } = await db
    .from('questions')
    .select('general_comment')
    .eq('id', params.questionId)
    .single()

  const { data: alternatives } = await db
    .from('alternatives')
    .select('id, is_correct, alternative_comment')
    .eq('question_id', params.questionId)

  if (!alternatives || alternatives.length === 0) return null

  const correct = alternatives.find((a) => a.is_correct)
  const selected = alternatives.find((a) => a.id === params.selectedAlternativeId)
  if (!correct || !selected) return null

  return {
    isCorrect: selected.is_correct,
    correctAlternativeId: correct.id,
    generalComment: question?.general_comment ?? null,
    selectedAlternativeComment: selected.alternative_comment ?? null,
  }
}

/** Question ids already answered by an anonymous session. */
export async function getAnsweredQuestionIdsBySession(
  db: Db,
  anonymousSessionId: string,
): Promise<string[]> {
  const { data } = await db
    .from('answer_attempts')
    .select('question_id')
    .eq('anonymous_session_id', anonymousSessionId)
  return (data ?? []).map((r) => r.question_id)
}

/** Question ids already answered by an authenticated user. */
export async function getAnsweredQuestionIdsByUser(
  db: Db,
  userId: string,
): Promise<string[]> {
  const { data } = await db
    .from('answer_attempts')
    .select('question_id')
    .eq('user_id', userId)
  return (data ?? []).map((r) => r.question_id)
}

export async function countAnswersBySession(
  db: Db,
  anonymousSessionId: string,
): Promise<number> {
  const { count } = await db
    .from('answer_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('anonymous_session_id', anonymousSessionId)
  return count ?? 0
}

export async function countAnswersByUser(
  db: Db,
  userId: string,
): Promise<number> {
  const { count } = await db
    .from('answer_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
  return count ?? 0
}

/** Persist an answer attempt. */
export async function recordAnswerAttempt(
  db: Db,
  params: {
    userId?: string | null
    anonymousSessionId?: string | null
    questionId: string
    selectedAlternativeId: string
    isCorrect: boolean
    careerId?: string | null
    boardId?: string | null
  },
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await db.from('answer_attempts').insert({
    user_id: params.userId ?? null,
    anonymous_session_id: params.anonymousSessionId ?? null,
    question_id: params.questionId,
    selected_alternative_id: params.selectedAlternativeId,
    is_correct: params.isCorrect,
    career_id: params.careerId ?? null,
    board_id: params.boardId ?? null,
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
