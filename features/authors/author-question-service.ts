import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/db/database.types'
import type { Difficulty, SourceType } from '@/lib/validation/schemas'
import {
  validateForPublish,
  type QuestionValidationInput,
} from '@/features/questions/question-validation'
import { authorOwnsQuestion } from './author-permissions'

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
  career_id: string
  subject_id: string
  board_id?: string | null
  difficulty: Difficulty
  source_type: SourceType
  source_orgao?: string | null
  source_cargo?: string | null
  source_year?: number | null
  source_reference?: string | null
  statement: string
  general_comment?: string | null
  alternatives?: AlternativeDraft[]
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

function questionRow(authorId: string, input: QuestionDraftInput) {
  return {
    author_id: authorId,
    career_id: input.career_id,
    subject_id: input.subject_id,
    board_id: input.board_id ?? null,
    difficulty: input.difficulty,
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

  const { error } = await db
    .from('questions')
    .update(questionRow(authorId, input))
    .eq('id', questionId)
  if (error) return { ok: false, code: 'error', errors: [error.message] }

  if (input.alternatives) {
    const altError = await replaceAlternatives(db, questionId, input.alternatives)
    if (altError) return { ok: false, code: 'error', errors: [altError] }
  }

  return { ok: true, data: { id: questionId } }
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
    difficulty: question.difficulty as Difficulty,
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
       alternatives(id, label, text, is_correct, alternative_comment, position)`,
    )
    .eq('id', questionId)
    .eq('author_id', authorId)
    .maybeSingle()
  return data
}
