import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/db/database.types'

type Db = SupabaseClient<Database>

/**
 * Read model for the question review page (/questao/[id]).
 *
 * Unlike the feed payload, the review intentionally includes the correct
 * alternative and all author comments — access is restricted to active
 * subscribers at the page level, and the caller passes the service client
 * only after that check.
 */

export type ReviewAlternative = {
  id: string
  label: string
  text: string
  position: number
  isCorrect: boolean
  comment: string | null
}

export type QuestionReview = {
  id: string
  statement: string
  generalComment: string | null
  difficulty: string | null
  subject: string | null
  board: string | null
  careerSlug: string | null
  imagePath: string | null
  alternatives: ReviewAlternative[]
  /** Alternative chosen in the user's most recent attempt, if any. */
  lastSelectedAlternativeId: string | null
}

export async function getQuestionReview(
  db: Db,
  userId: string,
  questionId: string,
): Promise<QuestionReview | null> {
  const { data } = await db
    .from('questions')
    .select(
      `id, statement, general_comment, difficulty, image_path, status,
       career:careers(slug),
       subject:subjects(name),
       board:boards(name),
       alternatives(id, label, text, position, is_correct, alternative_comment)`,
    )
    .eq('id', questionId)
    .maybeSingle()

  if (!data || data.status !== 'published') return null

  const { data: attempt } = await db
    .from('answer_attempts')
    .select('selected_alternative_id')
    .eq('user_id', userId)
    .eq('question_id', questionId)
    .order('answered_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const career = Array.isArray(data.career) ? data.career[0] : data.career
  const subject = Array.isArray(data.subject) ? data.subject[0] : data.subject
  const board = Array.isArray(data.board) ? data.board[0] : data.board

  return {
    id: data.id,
    statement: data.statement,
    generalComment: data.general_comment ?? null,
    difficulty: data.difficulty,
    subject: subject?.name ?? null,
    board: board?.name ?? null,
    careerSlug: career?.slug ?? null,
    imagePath: data.image_path ?? null,
    alternatives: (data.alternatives ?? [])
      .map((a) => ({
        id: a.id,
        label: a.label,
        text: a.text,
        position: a.position,
        isCorrect: a.is_correct,
        comment: a.alternative_comment ?? null,
      }))
      .sort((a, b) => a.position - b.position),
    lastSelectedAlternativeId: attempt?.selected_alternative_id ?? null,
  }
}
