import { describe, expect, it } from 'vitest'
import { evaluateSubscriptionAccess } from '@/features/billing/subscription-rules'

describe('subscription access rules', () => {
  const now = new Date('2026-06-01T12:00:00.000Z')

  it('blocks unauthenticated visitors from subscriber-only features', () => {
    const result = evaluateSubscriptionAccess({
      isAuthenticated: false,
      status: null,
      now,
    })

    expect(result).toEqual({
      isSubscriber: false,
      requiresAuthentication: true,
      subscriptionRequired: false,
      reason: 'unauthenticated',
    })
  })

  it('allows active subscriptions with a future period end', () => {
    const result = evaluateSubscriptionAccess({
      isAuthenticated: true,
      status: 'active',
      currentPeriodEnd: '2026-07-01T12:00:00.000Z',
      now,
    })

    expect(result.isSubscriber).toBe(true)
    expect(result.subscriptionRequired).toBe(false)
  })

  it('allows active subscriptions when the provider does not send a period end yet', () => {
    const result = evaluateSubscriptionAccess({
      isAuthenticated: true,
      status: 'active',
      currentPeriodEnd: null,
      now,
    })

    expect(result.isSubscriber).toBe(true)
  })

  it('blocks active rows whose current period has already ended', () => {
    const result = evaluateSubscriptionAccess({
      isAuthenticated: true,
      status: 'active',
      currentPeriodEnd: '2026-05-31T23:59:59.000Z',
      now,
    })

    expect(result).toMatchObject({
      isSubscriber: false,
      subscriptionRequired: true,
      reason: 'expired',
    })
  })

  it.each(['pending', 'past_due', 'canceled', 'expired'] as const)(
    'blocks %s subscriptions until Stripe confirms access',
    (status) => {
      const result = evaluateSubscriptionAccess({
        isAuthenticated: true,
        status,
        now,
      })

      expect(result.isSubscriber).toBe(false)
      expect(result.subscriptionRequired).toBe(true)
      expect(result.reason).toBe(status)
    },
  )
})
