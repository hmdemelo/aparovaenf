import { describe, it, expect, vi } from 'vitest'
import {
  ProductEventNames,
  PRODUCT_EVENT_NAMES,
  recordProductEvent,
  type ProductEventRecorder,
} from '@/features/analytics/product-events'

function fakeRecorder(error: { message: string } | null = null) {
  const insert = vi.fn().mockResolvedValue({ error })
  const from = vi.fn().mockReturnValue({ insert })
  const client = { from } as unknown as ProductEventRecorder
  return { client, from, insert }
}

describe('product event names', () => {
  it('exposes the minimum funnel events', () => {
    expect(PRODUCT_EVENT_NAMES).toEqual(
      expect.arrayContaining([
        'landing_viewed',
        'career_selected',
        'question_viewed',
        'question_answered',
        'signup_required_shown',
        'signup_completed',
        'trial_finished',
        'checkout_started',
        'subscription_activated',
        'favorite_attempted',
        'favorite_saved',
      ]),
    )
    expect(PRODUCT_EVENT_NAMES).toHaveLength(11)
  })
})

describe('recordProductEvent', () => {
  it('inserts into product_events with the given event name', async () => {
    const { client, from, insert } = fakeRecorder()

    const result = await recordProductEvent(client, {
      event_name: ProductEventNames.CAREER_SELECTED,
      career_id: '11111111-1111-1111-1111-111111111111',
    })

    expect(result.ok).toBe(true)
    expect(from).toHaveBeenCalledWith('product_events')
    expect(insert).toHaveBeenCalledTimes(1)
    const row = insert.mock.calls[0][0]
    expect(row.event_name).toBe('career_selected')
    expect(row.career_id).toBe('11111111-1111-1111-1111-111111111111')
  })

  it('defaults metadata to an empty object and nulls optional ids', async () => {
    const { client, insert } = fakeRecorder()

    await recordProductEvent(client, {
      event_name: ProductEventNames.LANDING_VIEWED,
    })

    const row = insert.mock.calls[0][0]
    expect(row.metadata).toEqual({})
    expect(row.user_id).toBeNull()
    expect(row.anonymous_session_id).toBeNull()
    expect(row.question_id).toBeNull()
  })

  it('preserves provided user, anonymous session and metadata', async () => {
    const { client, insert } = fakeRecorder()

    await recordProductEvent(client, {
      event_name: ProductEventNames.QUESTION_ANSWERED,
      user_id: 'user-1',
      anonymous_session_id: 'anon-1',
      question_id: 'q-1',
      metadata: { is_correct: true },
    })

    const row = insert.mock.calls[0][0]
    expect(row.user_id).toBe('user-1')
    expect(row.anonymous_session_id).toBe('anon-1')
    expect(row.question_id).toBe('q-1')
    expect(row.metadata).toEqual({ is_correct: true })
  })

  it('never throws on a database error; returns ok=false with the message', async () => {
    const { client } = fakeRecorder({ message: 'insert failed' })

    const result = await recordProductEvent(client, {
      event_name: ProductEventNames.TRIAL_FINISHED,
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('insert failed')
    }
  })
})
