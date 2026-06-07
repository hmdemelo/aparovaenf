import { describe, expect, it, vi } from 'vitest'
import {
  activateSubscriptionFromWebhook,
  cancelSubscriptionFromWebhook,
  markSubscriptionPastDueFromWebhook,
} from '@/features/billing/subscription-service'

function queryChain(result: { data: unknown; error: unknown }) {
  const chain = {
    select: vi.fn(),
    update: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
    neq: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue(result),
  }
  chain.select.mockReturnValue(chain)
  chain.update.mockReturnValue(chain)
  chain.eq.mockReturnValue(chain)
  chain.in.mockResolvedValue({ error: null })
  chain.neq.mockResolvedValue({ error: null })
  return chain
}

describe('Stripe subscription synchronization', () => {
  it('reactivates an existing subscription from a current invoice payload', async () => {
    const existing = queryChain({
      data: {
        id: 'local-subscription',
        user_id: 'user-1',
        plan: 'monthly',
        provider_customer_id: 'cus_1',
        provider_subscription_id: 'sub_renewing',
      },
      error: null,
    })
    const expire = queryChain({ data: null, error: null })
    const update = queryChain({ data: null, error: null })
    update.eq.mockResolvedValue({ error: null })
    const from = vi
      .fn()
      .mockReturnValueOnce(existing)
      .mockReturnValueOnce(expire)
      .mockReturnValueOnce(update)
    const db = { from }

    const result = await activateSubscriptionFromWebhook(db as never, {
      id: 'evt_invoice_paid',
      type: 'invoice.paid',
      data: {
        object: {
          id: 'in_1',
          customer: 'cus_1',
          period_start: 1_780_272_000,
          period_end: 1_782_864_000,
          parent: {
            subscription_details: {
              subscription: 'sub_renewing',
              metadata: {},
            },
          },
        },
      },
    })

    expect(result).toMatchObject({
      ok: true,
      activated: true,
      subscriptionId: 'local-subscription',
      userId: 'user-1',
      plan: 'monthly',
    })
    expect(update.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'active',
        provider: 'stripe',
        provider_subscription_id: 'sub_renewing',
        current_period_start: new Date(1_780_272_000 * 1000).toISOString(),
        current_period_end: new Date(1_782_864_000 * 1000).toISOString(),
      }),
    )
  })

  it('does not activate an unpaid completed checkout', async () => {
    const db = { from: vi.fn() }

    const result = await activateSubscriptionFromWebhook(db as never, {
      id: 'evt_unpaid',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_unpaid',
          payment_status: 'unpaid',
          metadata: {
            user_id: 'user-1',
            plan: 'monthly',
            subscription_id: 'subscription-1',
          },
        },
      },
    })

    expect(result).toEqual({ ok: true, activated: false })
    expect(db.from).not.toHaveBeenCalled()
  })

  it('marks only an active Stripe subscription as past due', async () => {
    const chain = queryChain({ data: null, error: null })
    const db = { from: vi.fn(() => chain) }

    const result = await markSubscriptionPastDueFromWebhook(
      db as never,
      'sub_failed',
    )

    expect(result).toEqual({ ok: true })
    expect(chain.update).toHaveBeenCalledWith({ status: 'past_due' })
    expect(chain.eq).toHaveBeenCalledWith('provider', 'stripe')
    expect(chain.eq).toHaveBeenCalledWith(
      'provider_subscription_id',
      'sub_failed',
    )
    expect(chain.eq).toHaveBeenCalledWith('status', 'active')
  })

  it('expires active or past-due Stripe subscriptions after deletion', async () => {
    const chain = queryChain({ data: null, error: null })
    const db = { from: vi.fn(() => chain) }

    const result = await cancelSubscriptionFromWebhook(
      db as never,
      'sub_deleted',
    )

    expect(result).toEqual({ ok: true })
    expect(chain.update).toHaveBeenCalledWith({ status: 'expired' })
    expect(chain.eq).toHaveBeenCalledWith('provider', 'stripe')
    expect(chain.eq).toHaveBeenCalledWith(
      'provider_subscription_id',
      'sub_deleted',
    )
    expect(chain.in).toHaveBeenCalledWith('status', ['active', 'past_due'])
  })
})
