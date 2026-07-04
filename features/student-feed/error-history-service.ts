import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/db/database.types'

type Db = SupabaseClient<Database>

/**
 * Error-history service. Lists the questions a subscriber answered incorrectly,
 * most recent first, with the question statement and general comment so they can
 * review weak points. Subscriber gating is enforced at the route/page level.
 */

export type ErrorHistoryItem = {
  questionId: string
  statement: string
  generalComment: string | null
  subject: string | null
  careerSlug: string | null
  answeredAt: string
}

/** Upper bound for retention lists until "load more" pagination ships. */
export const ERROR_HISTORY_LIST_LIMIT = 50

export async function listErrorHistory(
  db: Db,
  userId: string,
): Promise<ErrorHistoryItem[]> {
  const { data } = await db
    .from('answer_attempts')
    .select(
      `answered_at,
       question:questions(id, statement, general_comment, subject:subjects(name), career:careers(slug))`,
    )
    .eq('user_id', userId)
    .eq('is_correct', false)
    .order('answered_at', { ascending: false })
    .limit(ERROR_HISTORY_LIST_LIMIT)

  const seen = new Set<string>()
  const items: ErrorHistoryItem[] = []
  for (const row of data ?? []) {
    const q = Array.isArray(row.question) ? row.question[0] : row.question
    if (!q || seen.has(q.id)) continue
    seen.add(q.id)
    const subject = Array.isArray(q.subject) ? q.subject[0] : q.subject
    const career = Array.isArray(q.career) ? q.career[0] : q.career
    items.push({
      questionId: q.id,
      statement: q.statement,
      generalComment: q.general_comment ?? null,
      subject: subject?.name ?? null,
      careerSlug: career?.slug ?? null,
      answeredAt: row.answered_at,
    })
  }
  return items
}
