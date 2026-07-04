import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/db/database.types'

type Db = SupabaseClient<Database>

/**
 * Answered-questions history: every attempt the user made, most recent first,
 * with the question statement, correctness, and the career slug so each item can
 * link back to the feed for review. Entitlement is enforced at the page level.
 */

export type AnswerHistoryItem = {
  attemptId: string
  questionId: string
  statement: string
  isCorrect: boolean
  answeredAt: string
  careerSlug: string | null
}

/** Upper bound for retention lists until "load more" pagination ships. */
export const ANSWER_HISTORY_LIST_LIMIT = 50

export async function listAnswerHistory(
  db: Db,
  userId: string,
): Promise<AnswerHistoryItem[]> {
  const { data } = await db
    .from('answer_attempts')
    .select(
      `id, is_correct, answered_at,
       question:questions(id, statement, career:careers(slug))`,
    )
    .eq('user_id', userId)
    .order('answered_at', { ascending: false })
    .limit(ANSWER_HISTORY_LIST_LIMIT)

  const items: AnswerHistoryItem[] = []
  for (const row of data ?? []) {
    const question = Array.isArray(row.question) ? row.question[0] : row.question
    if (!question) continue
    const career = Array.isArray(question.career)
      ? question.career[0]
      : question.career
    items.push({
      attemptId: row.id,
      questionId: question.id,
      statement: question.statement,
      isCorrect: row.is_correct,
      answeredAt: row.answered_at,
      careerSlug: career?.slug ?? null,
    })
  }
  return items
}
