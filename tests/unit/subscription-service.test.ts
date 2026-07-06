import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  activateSubscriptionFromWebhook,
  cancelSubscriptionFromWebhook,
  createAsaasCheckout,
  expireSubscriptionFromRefund,
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

describe('Asaas subscription synchronization', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renews an active card subscription matched by the Asaas subscription id', async () => {
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
      id: 'evt_renewal',
      event: 'PAYMENT_CONFIRMED',
      payment: {
        id: 'pay_renewal_1',
        customer: 'cus_1',
        subscription: 'sub_renewing',
        billingType: 'CREDIT_CARD',
        paymentDate: '2026-07-01T12:00:00.000Z',
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
        provider: 'asaas',
        provider_subscription_id: 'sub_renewing',
        current_period_start: '2026-07-01T12:00:00.000Z',
        current_period_end: '2026-08-01T12:00:00.000Z',
      }),
    )
  })

  it('flags the first activation when a pending subscription is paid via externalReference', async () => {
    const existing = queryChain({
      data: {
        id: 'local-subscription',
        user_id: 'user-1',
        plan: 'monthly',
        status: 'pending',
        provider_customer_id: null,
        provider_subscription_id: 'chk_1',
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
      id: 'evt_first_payment',
      event: 'PAYMENT_CONFIRMED',
      payment: {
        id: 'pay_first_1',
        customer: 'cus_1',
        subscription: 'sub_new',
        billingType: 'CREDIT_CARD',
        externalReference: 'local-subscription',
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
    // A primeira ativação troca o id do checkout pelo id real da assinatura.
    expect(update.update).toHaveBeenCalledWith(
      expect.objectContaining({
        provider_customer_id: 'cus_1',
        provider_subscription_id: 'sub_new',
      }),
    )
  })

  it('activates a pending Pix subscription with the plan fallback period and no provider subscription', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-01T12:00:00.000Z'))

    const existing = queryChain({
      data: {
        id: 'pix-subscription',
        user_id: 'user-1',
        plan: 'annual',
        status: 'pending',
        provider_customer_id: null,
        provider_subscription_id: null,
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
      id: 'evt_pix_paid',
      event: 'PAYMENT_RECEIVED',
      payment: {
        id: 'pay_pix_1',
        customer: 'cus_pix',
        billingType: 'PIX',
        externalReference: 'pix-subscription',
      },
    })

    expect(result).toMatchObject({
      ok: true,
      activated: true,
      firstActivation: true,
      subscriptionId: 'pix-subscription',
      userId: 'user-1',
      plan: 'annual',
    })
    expect(update.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'active',
        current_period_start: '2026-07-01T12:00:00.000Z',
        current_period_end: '2027-07-01T12:00:00.000Z',
      }),
    )
  })

  it('correlates the first payment through the checkout session id when externalReference is absent', async () => {
    const existing = queryChain({
      data: {
        id: 'local-subscription',
        user_id: 'user-1',
        plan: 'monthly',
        status: 'pending',
        provider_customer_id: null,
        provider_subscription_id: 'chk_correlate_1',
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
      id: 'evt_checkout_session',
      event: 'PAYMENT_RECEIVED',
      payment: {
        id: 'pay_pix_2',
        billingType: 'PIX',
        checkoutSession: 'chk_correlate_1',
      },
    })

    expect(result).toMatchObject({
      ok: true,
      activated: true,
      subscriptionId: 'local-subscription',
    })
    expect(existing.eq).toHaveBeenCalledWith(
      'provider_subscription_id',
      'chk_correlate_1',
    )
  })

  it('ignores PAYMENT_RECEIVED for card payments (funds settlement, ~32 days later)', async () => {
    const db = { from: vi.fn() }

    const result = await activateSubscriptionFromWebhook(db as never, {
      id: 'evt_card_received',
      event: 'PAYMENT_RECEIVED',
      payment: {
        id: 'pay_late_settlement',
        billingType: 'CREDIT_CARD',
        subscription: 'sub_1',
      },
    })

    expect(result).toEqual({ ok: true, activated: false })
    expect(db.from).not.toHaveBeenCalled()
  })

  it('ignores events that are not activation events', async () => {
    const db = { from: vi.fn() }

    const result = await activateSubscriptionFromWebhook(db as never, {
      id: 'evt_created',
      event: 'PAYMENT_CREATED',
      payment: { id: 'pay_created', billingType: 'PIX' },
    })

    expect(result).toEqual({ ok: true, activated: false })
    expect(db.from).not.toHaveBeenCalled()
  })

  it('fails when the payment cannot be correlated to a local subscription', async () => {
    const missing = queryChain({ data: null, error: null })
    const db = { from: vi.fn(() => missing) }

    const result = await activateSubscriptionFromWebhook(db as never, {
      id: 'evt_orphan',
      event: 'PAYMENT_CONFIRMED',
      payment: {
        id: 'pay_orphan',
        billingType: 'CREDIT_CARD',
        externalReference: 'unknown-subscription',
      },
    })

    expect(result).toEqual({
      ok: false,
      error: 'missing subscription reference',
    })
  })

  it('marks only an active Asaas subscription as past due', async () => {
    const chain = queryChain({ data: null, error: null })
    const db = { from: vi.fn(() => chain) }

    const result = await markSubscriptionPastDueFromWebhook(
      db as never,
      'sub_failed',
    )

    expect(result).toEqual({ ok: true })
    expect(chain.update).toHaveBeenCalledWith({ status: 'past_due' })
    expect(chain.eq).toHaveBeenCalledWith('provider', 'asaas')
    expect(chain.eq).toHaveBeenCalledWith(
      'provider_subscription_id',
      'sub_failed',
    )
    expect(chain.eq).toHaveBeenCalledWith('status', 'active')
  })

  it('expires active or past-due Asaas subscriptions after deletion', async () => {
    const chain = queryChain({ data: null, error: null })
    const db = { from: vi.fn(() => chain) }

    const result = await cancelSubscriptionFromWebhook(
      db as never,
      'sub_deleted',
    )

    expect(result).toEqual({ ok: true })
    expect(chain.update).toHaveBeenCalledWith({ status: 'expired' })
    expect(chain.eq).toHaveBeenCalledWith('provider', 'asaas')
    expect(chain.eq).toHaveBeenCalledWith(
      'provider_subscription_id',
      'sub_deleted',
    )
    expect(chain.in).toHaveBeenCalledWith('status', ['active', 'past_due'])
  })

  it('expires the subscription tied to a refunded payment', async () => {
    const existing = queryChain({
      data: {
        id: 'local-subscription',
        user_id: 'user-1',
        plan: 'monthly',
        status: 'active',
        provider_customer_id: 'cus_1',
        provider_subscription_id: 'sub_refunded',
      },
      error: null,
    })
    const update = queryChain({ data: null, error: null })
    const from = vi
      .fn()
      .mockReturnValueOnce(existing)
      .mockReturnValueOnce(update)
    const db = { from }

    const result = await expireSubscriptionFromRefund(db as never, {
      id: 'evt_refund',
      event: 'PAYMENT_REFUNDED',
      payment: {
        id: 'pay_refund_1',
        subscription: 'sub_refunded',
        billingType: 'CREDIT_CARD',
      },
    })

    expect(result).toEqual({ ok: true })
    expect(update.update).toHaveBeenCalledWith({ status: 'expired' })
    expect(update.eq).toHaveBeenCalledWith('id', 'local-subscription')
    expect(update.in).toHaveBeenCalledWith('status', ['active', 'past_due'])
  })

  it('acknowledges a refund that matches no local subscription', async () => {
    const missing = queryChain({ data: null, error: null })
    const db = { from: vi.fn(() => missing) }

    const result = await expireSubscriptionFromRefund(db as never, {
      id: 'evt_refund_orphan',
      event: 'PAYMENT_REFUNDED',
      payment: { id: 'pay_orphan', subscription: 'sub_unknown' },
    })

    expect(result).toEqual({ ok: true })
  })
})

describe('createAsaasCheckout customer prefill', () => {
  const env = {
    NODE_ENV: 'production',
    ASAAS_API_KEY: 'prod_test_key',
    NEXT_PUBLIC_APP_URL: 'https://app.test',
  } as never

  const checkoutOk = {
    ok: true,
    status: 200,
    text: () =>
      Promise.resolve(
        JSON.stringify({
          id: 'checkout-1',
          link: 'https://asaas.test/checkout/checkout-1',
          status: 'ACTIVE',
        }),
      ),
  }

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends customerData with the logged-in name and email', async () => {
    const fetchMock = vi.fn().mockResolvedValue(checkoutOk)
    vi.stubGlobal('fetch', fetchMock)

    await createAsaasCheckout({
      env,
      planId: 'monthly',
      subscriptionId: 'sub-local-1',
      user: { id: 'user-1', email: 'hugo@example.com', name: 'Hugo Melo' },
      paymentMethod: 'pix',
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.customerData).toEqual({
      name: 'Hugo Melo',
      email: 'hugo@example.com',
    })
  })

  it('retries without customerData when Asaas rejects the prefill', async () => {
    const rejected = {
      ok: false,
      status: 400,
      text: () =>
        Promise.resolve(
          JSON.stringify({
            errors: [{ code: 'invalid_customerData', description: 'CPF obrigatório' }],
          }),
        ),
    }
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(rejected)
      .mockResolvedValueOnce(checkoutOk)
    vi.stubGlobal('fetch', fetchMock)

    const checkout = await createAsaasCheckout({
      env,
      planId: 'monthly',
      subscriptionId: 'sub-local-1',
      user: { id: 'user-1', email: 'hugo@example.com', name: 'Hugo Melo' },
      paymentMethod: 'pix',
    })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    const firstBody = JSON.parse(fetchMock.mock.calls[0][1].body)
    const retryBody = JSON.parse(fetchMock.mock.calls[1][1].body)
    expect(firstBody.customerData).toBeDefined()
    expect(retryBody.customerData).toBeUndefined()
    expect(checkout.checkoutId).toBe('checkout-1')
  })

  it('omits customerData when the user has neither name nor email', async () => {
    const fetchMock = vi.fn().mockResolvedValue(checkoutOk)
    vi.stubGlobal('fetch', fetchMock)

    await createAsaasCheckout({
      env,
      planId: 'monthly',
      subscriptionId: 'sub-local-1',
      user: { id: 'user-1', email: null, name: null },
      paymentMethod: 'pix',
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.customerData).toBeUndefined()
  })
})
