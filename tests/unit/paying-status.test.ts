import { describe, expect, it } from 'vitest'
import { evaluatePayingOrExPaying } from '@/features/account/account-service'

describe('evaluatePayingOrExPaying', () => {
  it('is false when the user has no subscriptions', () => {
    expect(evaluatePayingOrExPaying([])).toBe(false)
  })

  it('is false when the only subscription is pending', () => {
    expect(evaluatePayingOrExPaying(['pending'])).toBe(false)
  })

  it('is true for an active subscription', () => {
    expect(evaluatePayingOrExPaying(['active'])).toBe(true)
  })

  it('is true for ex-paying statuses (canceled, expired, past_due)', () => {
    expect(evaluatePayingOrExPaying(['canceled'])).toBe(true)
    expect(evaluatePayingOrExPaying(['expired'])).toBe(true)
    expect(evaluatePayingOrExPaying(['past_due'])).toBe(true)
  })

  it('is true when any non-pending subscription exists alongside a pending one', () => {
    expect(evaluatePayingOrExPaying(['pending', 'canceled'])).toBe(true)
  })
})
