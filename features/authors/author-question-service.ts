import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/db/database.types'
import type { Difficulty, SourceType } from '@/lib/validation/schemas'
import {
  validateForPublish,
  type QuestionValidationInput,
} from '@/features/questions/question-validation'
import { authorOwnsQuestion } from './author-permissions'
import { slugify } from '@/lib/text/slugify'

type Db = SupabaseClient<Database>

/**
 * Author question service: create, edit, list, and publish questions owned by
 * an author. Queries run under the caller's RLS (author-scoped client), and
 * ownership is also checked here so routes can return a clean 403.
 */

export type AlternativeDraft = {
  label: string
  text: string
  is_correct: boolean
  alternative_comment?: string | null
}

export type QuestionDraftInput = {
  career_id?: string | null
  subject_id?: string | null
  board_id?: string | null
  difficulty?: Difficulty | null
  source_type: SourceType
  source_orgao?: string | null
  source_cargo?: string | null
  source_year?: number | null
  source_reference?: string | null
  statement: string
  general_comment?: string | null
  alternatives?: AlternativeDraft[]
  topic_ids?: string[]
}

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: 'forbidden' | 'not_found' | 'validation' | 'error'; errors: string[] }

async function replaceAlternatives(
  db: Db,
  questionId: string,
  alternatives: AlternativeDraft[],
): Promise<string | null> {
  const { error: delError } = await db
    .from('alternatives')
    .delete()
    .eq('question_id', questionId)
  if (delError) return delError.message

  if (alternatives.length === 0) return null

  const rows = alternatives.map((a, index) => ({
    question_id: questionId,
    label: a.label,
    text: a.text,
    is_correct: a.is_correct,
    alternative_comment: a.alternative_comment ?? null,
    position: index,
  }))
  const { error: insError } = await db.from('alternatives').insert(rows)
  return insError?.message ?? null
}

async function validateTopicIds(
  db: Db,
  questionId: string | null,
  subjectId: string | null,
  topicIds: string[],
): Promise<ServiceResult<null>> {
  if (topicIds.length > 20) {
    return { ok: false, code: 'validation', errors: ['Máximo de 20 assuntos permitidos.'] }
  }
  if (topicIds.length === 0) {
    return { ok: true, data: null }
  }
  if (!subjectId) {
    return { ok: false, code: 'validation', errors: ['Selecione uma disciplina antes de adicionar assuntos.'] }
  }

  const { data: dbTags, error: tagCheckError } = await db
    .from('tags')
    .select('id, subject_id')
    .in('id', topicIds)

  if (tagCheckError || !dbTags) {
    return { ok: false, code: 'error', errors: ['Erro ao validar os assuntos.'] }
  }

  if (dbTags.length !== topicIds.length) {
    return { ok: false, code: 'validation', errors: ['Um ou mais assuntos selecionados não existem.'] }
  }

  let existingTagIds: string[] = []
  if (questionId) {
    const { data: currentTags } = await db
      .from('question_tags')
      .select('tag_id')
      .eq('question_id', questionId)
    existingTagIds = (currentTags ?? []).map((t) => t.tag_id)
  }

  for (const tag of dbTags) {
    if (tag.subject_id !== subjectId) {
      const isLegacyPreserved = tag.subject_id === null && existingTagIds.includes(tag.id)
      if (!isLegacyPreserved) {
        return {
          ok: false,
          code: 'validation',
          errors: ['O assunto selecionado não pertence à disciplina.']
        }
      }
    }
  }

  return { ok: true, data: null }
}

async function syncQuestionTags(
  db: Db,
  questionId: string,
  topicIds: string[],
): Promise<string | null> {
  const { error: delError } = await db
    .from('question_tags')
    .delete()
    .eq('question_id', questionId)
  if (delError) return delError.message

  if (!topicIds || topicIds.length === 0) return null

  const cleanedIds = Array.from(new Set(topicIds.filter(Boolean)))
  if (cleanedIds.length === 0) return null

  const tagJoins = cleanedIds.map((tagId) => ({
    question_id: questionId,
    tag_id: tagId,
  }))

  const { error: joinError } = await db.from('question_tags').insert(tagJoins)
  return joinError?.message ?? null
}

function questionRow(authorId: string, input: QuestionDraftInput) {
  return {
    author_id: authorId,
    career_id: input.career_id ?? null,
    subject_id: input.subject_id ?? null,
    board_id: input.board_id ?? null,
    difficulty: input.difficulty ?? null,
    source_type: input.source_type,
    source_orgao: input.source_orgao ?? null,
    source_cargo: input.source_cargo ?? null,
    source_year: input.source_year ?? null,
    source_reference: input.source_reference ?? null,
    statement: input.statement,
    general_comment: input.general_comment ?? null,
  }
}

export async function createDraftQuestion(
  db: Db,
  authorId: string,
  input: QuestionDraftInput,
): Promise<ServiceResult<{ id: string }>> {
  const topicIds = Array.from(new Set(input.topic_ids ?? []))
  if (input.topic_ids) {
    const valResult = await validateTopicIds(db, null, input.subject_id ?? null, topicIds)
    if (!valResult.ok) return valResult
  }

  const { data, error } = await db
    .from('questions')
    .insert({ ...questionRow(authorId, input), status: 'draft' })
    .select('id')
    .single()
  if (error || !data) {
    return { ok: false, code: 'error', errors: [error?.message ?? 'insert failed'] }
  }

  if (input.alternatives && input.alternatives.length > 0) {
    const altError = await replaceAlternatives(db, data.id, input.alternatives)
    if (altError) return { ok: false, code: 'error', errors: [altError] }
  }

  if (input.topic_ids) {
    const tagError = await syncQuestionTags(db, data.id, topicIds)
    if (tagError) return { ok: false, code: 'error', errors: [tagError] }
  }

  return { ok: true, data: { id: data.id } }
}

export async function updateQuestion(
  db: Db,
  authorId: string,
  questionId: string,
  input: QuestionDraftInput,
): Promise<ServiceResult<{ id: string }>> {
  if (!(await authorOwnsQuestion(db, authorId, questionId))) {
    return { ok: false, code: 'forbidden', errors: ['not your question'] }
  }

  const topicIds = Array.from(new Set(input.topic_ids ?? []))
  if (input.topic_ids) {
    const valResult = await validateTopicIds(
      db,
      questionId,
      input.subject_id ?? null,
      topicIds,
    )
    if (!valResult.ok) return valResult
  }

  const { error } = await db
    .from('questions')
    .update(questionRow(authorId, input))
    .eq('id', questionId)
  if (error) return { ok: false, code: 'error', errors: [error.message] }

  if (input.alternatives) {
    const altError = await replaceAlternatives(db, questionId, input.alternatives)
    if (altError) return { ok: false, code: 'error', errors: [altError] }
  }

  if (input.topic_ids) {
    const tagError = await syncQuestionTags(db, questionId, topicIds)
    if (tagError) return { ok: false, code: 'error', errors: [tagError] }
  }

  return { ok: true, data: { id: questionId } }
}

export type BoardRecord = { id: string; name: string; slug: string }

/**
 * Create a board inline from the question editor "+" quick-add. Runs under the
 * author-scoped client; the RLS insert policy (migration 006) restricts this to
 * authors and admins. Upserts on `slug` so re-adding an existing board name
 * returns the existing row instead of failing on the unique constraint.
 */
export async function createBoardInline(
  db: Db,
  name: string,
  authorId: string,
): Promise<ServiceResult<BoardRecord>> {
  const trimmed = name.trim()
  if (!trimmed) {
    return { ok: false, code: 'validation', errors: ['O nome da banca é obrigatório.'] }
  }

  const slug = slugify(trimmed)
  const { data, error } = await db
    .from('boards')
    .insert({
      name: trimmed,
      slug,
      created_by_kind: 'author',
      created_by_author_id: authorId,
    })
    .select('id, name, slug')
    .single()

  if (error?.code === '23505') {
    const { data: existing } = await db
      .from('boards')
      .select('id, name, slug')
      .eq('slug', slug)
      .single()
    if (existing) return { ok: true, data: existing }
  }

  if (error || !data) {
    return {
      ok: false,
      code: 'error',
      errors: ['Não foi possível cadastrar a banca. Tente novamente.'],
    }
  }
  return { ok: true, data }
}

export async function publishQuestion(
  db: Db,
  authorId: string,
  questionId: string,
): Promise<ServiceResult<{ id: string }>> {
  if (!(await authorOwnsQuestion(db, authorId, questionId))) {
    return { ok: false, code: 'forbidden', errors: ['not your question'] }
  }

  const { data: question } = await db
    .from('questions')
    .select('statement, general_comment, career_id, subject_id, difficulty')
    .eq('id', questionId)
    .single()
  const { data: alternatives } = await db
    .from('alternatives')
    .select('label, text, is_correct')
    .eq('question_id', questionId)

  if (!question) return { ok: false, code: 'not_found', errors: ['question not found'] }

  const validationInput: QuestionValidationInput = {
    statement: question.statement,
    general_comment: question.general_comment ?? undefined,
    career_id: question.career_id,
    subject_id: question.subject_id,
    difficulty: question.difficulty,
    alternatives: (alternatives ?? []).map((a) => ({
      label: a.label,
      text: a.text,
      is_correct: a.is_correct,
    })),
  }
  const validation = validateForPublish(validationInput)
  if (!validation.valid) {
    return { ok: false, code: 'validation', errors: validation.errors }
  }

  const { error } = await db
    .from('questions')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', questionId)
  if (error) return { ok: false, code: 'error', errors: [error.message] }

  return { ok: true, data: { id: questionId } }
}

export async function listAuthorQuestions(db: Db, authorId: string) {
  const { data } = await db
    .from('questions')
    .select(
      'id, statement, status, difficulty, created_at, published_at, subject:subjects(name)',
    )
    .eq('author_id', authorId)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function getAuthorQuestion(
  db: Db,
  authorId: string,
  questionId: string,
) {
  const { data } = await db
    .from('questions')
    .select(
      `id, statement, general_comment, career_id, subject_id, board_id, difficulty,
       source_type, source_orgao, source_cargo, source_year, source_reference, status,
       alternatives(id, label, text, is_correct, alternative_comment, position),
       tags:question_tags(tag:tags(id, name, slug, subject_id))`,
    )
    .eq('id', questionId)
    .eq('author_id', authorId)
    .maybeSingle()

  if (!data) return null

  type QuestionTagRow = { tag: { id: string; name: string; slug: string; subject_id: string | null } | null }
  const formattedTags = ((data.tags ?? []) as QuestionTagRow[])
    .map((qt) => qt.tag)
    .filter((tag): tag is NonNullable<typeof tag> => Boolean(tag))

  return {
    ...data,
    tags: formattedTags,
  }
}

export type AuthorMetrics = {
  totalQuestions: number
  totalAnswers: number
  /** Fraction of received answers that were correct, in [0, 1]. */
  correctRate: number
}

/** Aggregate an author's question count and the answers received on them. */
export function computeAuthorMetrics(
  totalQuestions: number,
  attempts: ReadonlyArray<{ is_correct: boolean }>,
): AuthorMetrics {
  const totalAnswers = attempts.length
  const correct = attempts.filter((a) => a.is_correct).length
  return {
    totalQuestions,
    totalAnswers,
    correctRate: totalAnswers === 0 ? 0 : correct / totalAnswers,
  }
}

/**
 * Author-scoped metrics: questions created and answers received across all of
 * them. The `answer_attempts` RLS only exposes a user's own rows, so reading
 * answers from other students requires a service-role client. Safety relies on
 * `authorId` coming from the authenticated `resolveAuthorContext()` — never from
 * client input — so an author can never read another author's metrics.
 */
export async function getAuthorMetrics(
  db: Db,
  authorId: string,
): Promise<AuthorMetrics> {
  const { data: questions } = await db
    .from('questions')
    .select('id')
    .eq('author_id', authorId)

  const questionIds = (questions ?? []).map((q) => q.id)
  if (questionIds.length === 0) return computeAuthorMetrics(0, [])

  const { data: attempts } = await db
    .from('answer_attempts')
    .select('is_correct')
    .in('question_id', questionIds)

  return computeAuthorMetrics(questionIds.length, attempts ?? [])
}
