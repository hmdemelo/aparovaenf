import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  activateSubscriptionFromWebhook: vi.fn(),
}))

vi.mock('@/features/billing/subscription-service', () => ({
  activateSubscriptionFromWebhook: mocks.activateSubscriptionFromWebhook,
}))

import { confirmStripeMockCheckout } from '@/features/billing/mock-checkout'

function mockDb(subscription: {
  id: string
  user_id: string
  plan: 'monthly' | 'annual'
} | null) {
  const maybeSingle = vi.fn().mockResolvedValue({
    data: subscription,
    error: null,
  })
  const chain = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle,
  }
  chain.select.mockReturnValue(chain)
  chain.eq.mockReturnValue(chain)

  return {
    db: { from: vi.fn(() => chain) },
    chain,
  }
}

describe('Stripe mock checkout confirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.activateSubscriptionFromWebhook.mockResolvedValue({
      ok: true,
      activated: true,
      subscriptionId: 'subscription-1',
      userId: 'user-1',
      plan: 'annual',
    })
  })

  it('is disabled outside the explicit local mock mode', async () => {
    const { db } = mockDb(null)

    const result = await confirmStripeMockCheckout(db as never, {
      env: {
        NODE_ENV: 'production',
        STRIPE_SECRET_KEY: 'sk_live_example',
      },
      subscriptionId: 'subscription-1',
      authenticatedUserId: 'user-1',
    })

    expect(result).toEqual({ ok: false, error: 'mock checkout is disabled' })
    expect(db.from).not.toHaveBeenCalled()
  })

  it('loads only the authenticated users pending Stripe subscription', async () => {
    const { db, chain } = mockDb({
      id: 'subscription-1',
      user_id: 'user-1',
      plan: 'annual',
    })

    await confirmStripeMockCheckout(db as never, {
      env: {
        NODE_ENV: 'development',
        STRIPE_SECRET_KEY: 'stripe_dev_mock_secret_key',
      },
      subscriptionId: 'subscription-1',
      authenticatedUserId: 'user-1',
    })

    expect(chain.eq).toHaveBeenCalledWith('id', 'subscription-1')
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(chain.eq).toHaveBeenCalledWith('provider', 'stripe')
    expect(chain.eq).toHaveBeenCalledWith('status', 'pending')
    expect(mocks.activateSubscriptionFromWebhook).toHaveBeenCalledWith(
      db,
      expect.objectContaining({
        type: 'checkout.session.completed',
        data: {
          object: expect.objectContaining({
            payment_status: 'paid',
            client_reference_id: 'subscription-1',
            metadata: {
              user_id: 'user-1',
              plan: 'annual',
              subscription_id: 'subscription-1',
            },
          }),
        },
      }),
    )
  })

  it('does not activate when the pending subscription is not owned by the user', async () => {
    const { db } = mockDb(null)

    const result = await confirmStripeMockCheckout(db as never, {
      env: {
        NODE_ENV: 'development',
        STRIPE_SECRET_KEY: 'stripe_dev_mock_secret_key',
      },
      subscriptionId: 'subscription-1',
      authenticatedUserId: 'other-user',
    })

    expect(result).toEqual({
      ok: false,
      error: 'pending subscription not found',
    })
    expect(mocks.activateSubscriptionFromWebhook).not.toHaveBeenCalled()
  })
})
