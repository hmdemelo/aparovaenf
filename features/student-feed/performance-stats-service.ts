import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/db/database.types'

type Db = SupabaseClient<Database>

/**
 * Performance statistics for a student: accuracy per subject and per board,
 * derived from `answer_attempts`. Subscriber gating happens at the page level.
 */

export type PerformanceBucket = {
  name: string
  total: number
  correct: number
  /** 0-100, rounded to the nearest integer. */
  accuracy: number
}

export type PerformanceStats = {
  total: number
  correct: number
  accuracy: number
  bySubject: PerformanceBucket[]
  byBoard: PerformanceBucket[]
}

export type AttemptRow = {
  isCorrect: boolean
  subject: string | null
  board: string | null
}

function toBuckets(rows: AttemptRow[], key: 'subject' | 'board'): PerformanceBucket[] {
  const byName = new Map<string, { total: number; correct: number }>()
  for (const row of rows) {
    const name = row[key]
    if (!name) continue
    const bucket = byName.get(name) ?? { total: 0, correct: 0 }
    byName.set(name, {
      total: bucket.total + 1,
      correct: bucket.correct + (row.isCorrect ? 1 : 0),
    })
  }
  return Array.from(byName.entries())
    .map(([name, { total, correct }]) => ({
      name,
      total,
      correct,
      accuracy: Math.round((correct / total) * 100),
    }))
    .sort((a, b) => b.total - a.total)
}

/** Pure aggregation over attempt rows; exported for unit testing. */
export function aggregateAttempts(rows: AttemptRow[]): PerformanceStats {
  const total = rows.length
  const correct = rows.filter((r) => r.isCorrect).length
  return {
    total,
    correct,
    accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
    bySubject: toBuckets(rows, 'subject'),
    byBoard: toBuckets(rows, 'board'),
  }
}

export async function getPerformanceStats(
  db: Db,
  userId: string,
): Promise<PerformanceStats> {
  const { data } = await db
    .from('answer_attempts')
    .select(
      `is_correct,
       question:questions(subject:subjects(name), board:boards(name))`,
    )
    .eq('user_id', userId)

  const rows: AttemptRow[] = (data ?? []).map((row) => {
    const q = Array.isArray(row.question) ? row.question[0] : row.question
    const subject = q && (Array.isArray(q.subject) ? q.subject[0] : q.subject)
    const board = q && (Array.isArray(q.board) ? q.board[0] : q.board)
    return {
      isCorrect: row.is_correct,
      subject: subject?.name ?? null,
      board: board?.name ?? null,
    }
  })

  return aggregateAttempts(rows)
}
