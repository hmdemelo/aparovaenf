import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  activateSubscriptionFromWebhook,
  cancelSubscriptionFromWebhook,
  markSubscriptionPastDueFromWebhook,
  syncSubscriptionFromUpdatedEvent,
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
  afterEach(() => {
    vi.useRealTimers()
  })

  it('reactivates an existing subscription using the invoice line period, not the invoice usage period', async () => {
    const existing = queryChain({
      data: {
        id: 'local-subscription',
        user_id: 'user-1',
        plan: 'monthly',
        status: 'active',
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
          object: 'invoice',
          customer: 'cus_1',
          // Invoice-level period_* is the usage period (previous cycle), not
          // the paid billing period — Stripe reports both equal at renewal.
          period_start: 1_780_272_000,
          period_end: 1_780_272_000,
          lines: {
            data: [
              {
                period: { start: 1_780_272_000, end: 1_782_864_000 },
              },
            ],
          },
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
      firstActivation: false,
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

  it('falls back to the plan period when the paid invoice has no line periods', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-01T12:00:00.000Z'))

    const existing = queryChain({
      data: {
        id: 'local-subscription',
        user_id: 'user-1',
        plan: 'monthly',
        status: 'active',
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
      id: 'evt_invoice_paid_no_lines',
      type: 'invoice.paid',
      data: {
        object: {
          id: 'in_1',
          object: 'invoice',
          customer: 'cus_1',
          // Misleading usage-period timestamps must never become the new
          // current_period_end, or the renewed subscriber gets locked out.
          period_start: 1_782_950_400,
          period_end: 1_782_950_400,
          parent: {
            subscription_details: {
              subscription: 'sub_renewing',
              metadata: {},
            },
          },
        },
      },
    })

    expect(result).toMatchObject({ ok: true, activated: true })
    expect(update.update).toHaveBeenCalledWith(
      expect.objectContaining({
        current_period_start: '2026-07-01T12:00:00.000Z',
        current_period_end: '2026-08-01T12:00:00.000Z',
      }),
    )
  })

  it('flags the first activation when a pending subscription is paid', async () => {
    const existing = queryChain({
      data: {
        id: 'local-subscription',
        user_id: 'user-1',
        plan: 'monthly',
        status: 'pending',
        provider_customer_id: 'cus_1',
        provider_subscription_id: 'sub_new',
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
      id: 'evt_invoice_paid_first',
      type: 'invoice.paid',
      data: {
        object: {
          id: 'in_1',
          customer: 'cus_1',
          parent: {
            subscription_details: {
              subscription: 'sub_new',
              metadata: {},
            },
          },
        },
      },
    })

    expect(result).toMatchObject({
      ok: true,
      activated: true,
      firstActivation: true,
      subscriptionId: 'local-subscription',
      userId: 'user-1',
      plan: 'monthly',
    })
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

  it('syncs the billing period when Stripe reports an updated active subscription', async () => {
    const chain = queryChain({ data: null, error: null })
    const db = { from: vi.fn(() => chain) }

    const result = await syncSubscriptionFromUpdatedEvent(db as never, {
      id: 'evt_sub_updated',
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_updated_123',
          object: 'subscription',
          status: 'active',
          items: {
            data: [
              {
                current_period_start: 1_780_272_000,
                current_period_end: 1_782_864_000,
              },
            ],
          },
        },
      },
    })

    expect(result).toEqual({ ok: true })
    expect(chain.update).toHaveBeenCalledWith({
      status: 'active',
      current_period_start: new Date(1_780_272_000 * 1000).toISOString(),
      current_period_end: new Date(1_782_864_000 * 1000).toISOString(),
    })
    expect(chain.eq).toHaveBeenCalledWith('provider', 'stripe')
    expect(chain.eq).toHaveBeenCalledWith(
      'provider_subscription_id',
      'sub_updated_123',
    )
    expect(chain.in).toHaveBeenCalledWith('status', ['active', 'past_due'])
  })

  it('expires the local subscription when Stripe reports it unpaid', async () => {
    const chain = queryChain({ data: null, error: null })
    const db = { from: vi.fn(() => chain) }

    const result = await syncSubscriptionFromUpdatedEvent(db as never, {
      id: 'evt_sub_unpaid',
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_unpaid_123',
          object: 'subscription',
          status: 'unpaid',
        },
      },
    })

    expect(result).toEqual({ ok: true })
    expect(chain.update).toHaveBeenCalledWith({ status: 'expired' })
    expect(chain.in).toHaveBeenCalledWith('status', ['active', 'past_due'])
  })

  it('marks the local subscription past due when Stripe reports past_due', async () => {
    const chain = queryChain({ data: null, error: null })
    const db = { from: vi.fn(() => chain) }

    const result = await syncSubscriptionFromUpdatedEvent(db as never, {
      id: 'evt_sub_past_due',
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_past_due_123',
          object: 'subscription',
          status: 'past_due',
        },
      },
    })

    expect(result).toEqual({ ok: true })
    expect(chain.update).toHaveBeenCalledWith({ status: 'past_due' })
    expect(chain.eq).toHaveBeenCalledWith('status', 'active')
  })

  it('ignores subscription statuses that have no local mapping', async () => {
    const db = { from: vi.fn() }

    const result = await syncSubscriptionFromUpdatedEvent(db as never, {
      id: 'evt_sub_incomplete',
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_incomplete_123',
          object: 'subscription',
          status: 'incomplete',
        },
      },
    })

    expect(result).toEqual({ ok: true })
    expect(db.from).not.toHaveBeenCalled()
  })

  it('fails when the updated subscription event has no subscription id', async () => {
    const db = { from: vi.fn() }

    const result = await syncSubscriptionFromUpdatedEvent(db as never, {
      id: 'evt_sub_no_id',
      type: 'customer.subscription.updated',
      data: { object: { object: 'subscription', status: 'active' } },
    })

    expect(result).toEqual({
      ok: false,
      error: 'missing Stripe subscription id on updated subscription',
    })
    expect(db.from).not.toHaveBeenCalled()
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
