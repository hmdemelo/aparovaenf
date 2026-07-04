import { describe, expect, it } from 'vitest'
import {
  listFavorites,
  FAVORITES_LIST_LIMIT,
} from '@/features/student-feed/favorites-service'
import {
  listErrorHistory,
  ERROR_HISTORY_LIST_LIMIT,
} from '@/features/student-feed/error-history-service'
import {
  listAnswerHistory,
  ANSWER_HISTORY_LIST_LIMIT,
} from '@/features/account/answer-history-service'

/**
 * Fake Supabase query builder: chainable, thenable, and records the value
 * passed to .limit() so the services can be tested without a database.
 */
function makeFakeDb(recorded: { limit: number | null }) {
  const builder = {
    select: () => builder,
    eq: () => builder,
    order: () => builder,
    limit: (n: number) => {
      recorded.limit = n
      return builder
    },
    then: (resolve: (value: { data: never[] }) => void) =>
      resolve({ data: [] }),
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { from: () => builder } as any
}

describe('retention list limits', () => {
  it('caps the favorites list at 50 rows', async () => {
    const recorded = { limit: null as number | null }
    await listFavorites(makeFakeDb(recorded), 'user-1')
    expect(recorded.limit).toBe(FAVORITES_LIST_LIMIT)
    expect(FAVORITES_LIST_LIMIT).toBe(50)
  })

  it('caps the error history at 50 rows', async () => {
    const recorded = { limit: null as number | null }
    await listErrorHistory(makeFakeDb(recorded), 'user-1')
    expect(recorded.limit).toBe(ERROR_HISTORY_LIST_LIMIT)
    expect(ERROR_HISTORY_LIST_LIMIT).toBe(50)
  })

  it('caps the answer history at 50 rows', async () => {
    const recorded = { limit: null as number | null }
    await listAnswerHistory(makeFakeDb(recorded), 'user-1')
    expect(recorded.limit).toBe(ANSWER_HISTORY_LIST_LIMIT)
    expect(ANSWER_HISTORY_LIST_LIMIT).toBe(50)
  })
})
