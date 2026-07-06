import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  activateSubscriptionFromWebhook: vi.fn(),
}))

vi.mock('@/features/billing/subscription-service', () => ({
  activateSubscriptionFromWebhook: mocks.activateSubscriptionFromWebhook,
}))

import { confirmAsaasMockCheckout } from '@/features/billing/mock-checkout'

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

describe('Asaas mock checkout confirmation', () => {
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

    const result = await confirmAsaasMockCheckout(db as never, {
      env: {
        NODE_ENV: 'production',
        ASAAS_API_KEY: '$aact_prod_example',
      },
      subscriptionId: 'subscription-1',
      authenticatedUserId: 'user-1',
    })

    expect(result).toEqual({ ok: false, error: 'mock checkout is disabled' })
    expect(db.from).not.toHaveBeenCalled()
  })

  it('loads only the authenticated users pending Asaas subscription', async () => {
    const { db, chain } = mockDb({
      id: 'subscription-1',
      user_id: 'user-1',
      plan: 'annual',
    })

    await confirmAsaasMockCheckout(db as never, {
      env: {
        NODE_ENV: 'development',
        ASAAS_API_KEY: 'asaas_dev_mock_api_key',
      },
      subscriptionId: 'subscription-1',
      authenticatedUserId: 'user-1',
    })

    expect(chain.eq).toHaveBeenCalledWith('id', 'subscription-1')
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(chain.eq).toHaveBeenCalledWith('provider', 'asaas')
    expect(chain.eq).toHaveBeenCalledWith('status', 'pending')
    expect(mocks.activateSubscriptionFromWebhook).toHaveBeenCalledWith(
      db,
      expect.objectContaining({
        event: 'PAYMENT_CONFIRMED',
        payment: expect.objectContaining({
          billingType: 'CREDIT_CARD',
          externalReference: 'subscription-1',
        }),
      }),
    )
  })

  it('does not activate when the pending subscription is not owned by the user', async () => {
    const { db } = mockDb(null)

    const result = await confirmAsaasMockCheckout(db as never, {
      env: {
        NODE_ENV: 'development',
        ASAAS_API_KEY: 'asaas_dev_mock_api_key',
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
