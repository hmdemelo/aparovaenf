import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createSupabaseServiceClient: vi.fn(),
  getServerEnv: vi.fn(),
  createPaymentEventRepository: vi.fn(),
  recordReceived: vi.fn(),
  markProcessed: vi.fn(),
  markFailed: vi.fn(),
  activateSubscriptionFromWebhook: vi.fn(),
  markSubscriptionPastDueFromWebhook: vi.fn(),
  expireSubscriptionFromRefund: vi.fn(),
  track: vi.fn(),
}))

vi.mock('@/lib/db/server', () => ({
  createSupabaseServiceClient: mocks.createSupabaseServiceClient,
}))

vi.mock('@/lib/env/server', () => ({
  getServerEnv: mocks.getServerEnv,
}))

vi.mock('@/features/billing/payment-event-repository', () => ({
  createPaymentEventRepository: mocks.createPaymentEventRepository,
}))

vi.mock('@/features/billing/subscription-service', () => ({
  activateSubscriptionFromWebhook: mocks.activateSubscriptionFromWebhook,
  markSubscriptionPastDueFromWebhook: mocks.markSubscriptionPastDueFromWebhook,
  expireSubscriptionFromRefund: mocks.expireSubscriptionFromRefund,
}))

vi.mock('@/features/analytics/product-events-server', () => ({
  track: mocks.track,
}))

const WEBHOOK_TOKEN = 'webhook-token-of-16chars'

function webhookRequest(payload: unknown, options?: { token?: string | null }) {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  }
  const token = options?.token === undefined ? WEBHOOK_TOKEN : options.token
  if (token !== null) {
    headers['asaas-access-token'] = token
  }
  return new NextRequest('http://localhost/api/webhooks/asaas', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers,
  })
}

describe('POST /api/webhooks/asaas', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    mocks.getServerEnv.mockReturnValue({
      NODE_ENV: 'development',
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
      SUPABASE_SERVICE_ROLE_KEY: 'service',
      ASAAS_API_KEY: '$aact_hmlg_example_key',
      ASAAS_WEBHOOK_TOKEN: WEBHOOK_TOKEN,
      NEXT_PUBLIC_APP_URL: 'https://aprovaenf.test',
    })
    const mockQueryChain = {
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          user_id: '00000000-0000-0000-0000-0000000000a4',
          email: 'aluno@aprovaenf.local',
          name: 'Aluno',
        },
        error: null,
      }),
      eq: vi.fn().mockImplementation(function () {
        return mockQueryChain
      }),
      select: vi.fn().mockImplementation(function () {
        return mockQueryChain
      }),
    }
    const mockDb = {
      from: vi.fn().mockImplementation(() => mockQueryChain),
    }
    mocks.createSupabaseServiceClient.mockReturnValue(mockDb)
    mocks.createPaymentEventRepository.mockReturnValue({
      recordReceived: mocks.recordReceived,
      markProcessed: mocks.markProcessed,
      markFailed: mocks.markFailed,
    })
    mocks.recordReceived.mockResolvedValue({
      ok: true,
      status: 'inserted',
      event: { processing_status: 'received' },
    })
    mocks.markProcessed.mockResolvedValue({ ok: true })
    mocks.markFailed.mockResolvedValue({ ok: true })
    mocks.activateSubscriptionFromWebhook.mockResolvedValue({
      ok: true,
      activated: true,
      firstActivation: true,
      userId: '00000000-0000-0000-0000-0000000000a4',
      plan: 'annual',
      subscriptionId: '00000000-0000-0000-0000-00000000b111',
    })
    mocks.markSubscriptionPastDueFromWebhook.mockResolvedValue({ ok: true })
    mocks.expireSubscriptionFromRefund.mockResolvedValue({ ok: true })
    mocks.track.mockResolvedValue({ ok: true })
  })

  it('records, activates, marks processed, and tracks a confirmed card payment', async () => {
    const payload = {
      id: 'evt_confirmed_1',
      event: 'PAYMENT_CONFIRMED',
      payment: {
        id: 'pay_1',
        customer: 'cus_1',
        subscription: 'sub_1',
        billingType: 'CREDIT_CARD',
        externalReference: '00000000-0000-0000-0000-00000000b111',
        value: 287,
      },
    }
    const { POST } = await import('@/app/api/webhooks/asaas/route')

    const response = await POST(webhookRequest(payload))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toMatchObject({
      success: true,
      data: {
        received: true,
        duplicate: false,
        activated: true,
      },
    })
    expect(mocks.recordReceived).toHaveBeenCalledWith({
      providerEventId: 'evt_confirmed_1',
      eventType: 'PAYMENT_CONFIRMED',
      payload,
    })
    expect(mocks.activateSubscriptionFromWebhook).toHaveBeenCalledWith(
      expect.anything(),
      payload,
    )
    expect(mocks.markProcessed).toHaveBeenCalledWith('evt_confirmed_1')
    expect(mocks.track).toHaveBeenCalledWith(
      expect.objectContaining({
        event_name: 'subscription_activated',
        user_id: '00000000-0000-0000-0000-0000000000a4',
        metadata: expect.objectContaining({
          plan: 'annual',
          provider_event_id: 'evt_confirmed_1',
        }),
      }),
    )
  })

  it('routes a received Pix payment through the activation flow', async () => {
    const payload = {
      id: 'evt_pix_1',
      event: 'PAYMENT_RECEIVED',
      payment: {
        id: 'pay_pix_1',
        customer: 'cus_1',
        billingType: 'PIX',
        externalReference: '00000000-0000-0000-0000-00000000b111',
      },
    }
    const { POST } = await import('@/app/api/webhooks/asaas/route')

    const response = await POST(webhookRequest(payload))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toMatchObject({
      success: true,
      data: { received: true, activated: true },
    })
    expect(mocks.activateSubscriptionFromWebhook).toHaveBeenCalledWith(
      expect.anything(),
      payload,
    )
    expect(mocks.track).toHaveBeenCalledWith(
      expect.objectContaining({
        event_name: 'subscription_activated',
        metadata: expect.objectContaining({
          event_type: 'PAYMENT_RECEIVED',
        }),
      }),
    )
  })

  it('acknowledges an already processed provider event without activating twice', async () => {
    mocks.recordReceived.mockResolvedValue({
      ok: true,
      status: 'duplicate',
      event: { processing_status: 'processed' },
    })
    const payload = {
      id: 'evt_duplicate',
      event: 'PAYMENT_CONFIRMED',
      payment: { id: 'pay_dup', billingType: 'CREDIT_CARD' },
    }
    const { POST } = await import('@/app/api/webhooks/asaas/route')

    const response = await POST(webhookRequest(payload))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toMatchObject({
      success: true,
      data: {
        received: true,
        duplicate: true,
        activated: false,
      },
    })
    expect(mocks.activateSubscriptionFromWebhook).not.toHaveBeenCalled()
    expect(mocks.markProcessed).not.toHaveBeenCalled()
  })

  it('rejects requests without the webhook token', async () => {
    const payload = { id: 'evt_no_token', event: 'PAYMENT_CONFIRMED' }
    const { POST } = await import('@/app/api/webhooks/asaas/route')

    const response = await POST(webhookRequest(payload, { token: null }))
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json).toMatchObject({
      success: false,
      error: { code: 'unauthenticated' },
    })
    expect(mocks.recordReceived).not.toHaveBeenCalled()
  })

  it('rejects requests with a wrong webhook token', async () => {
    const payload = { id: 'evt_bad_token', event: 'PAYMENT_CONFIRMED' }
    const { POST } = await import('@/app/api/webhooks/asaas/route')

    const response = await POST(
      webhookRequest(payload, { token: 'wrong-token-of-16chars!!' }),
    )

    expect(response.status).toBe(401)
    expect(mocks.recordReceived).not.toHaveBeenCalled()
  })

  it('records processing errors and returns 500 so Asaas can retry', async () => {
    mocks.activateSubscriptionFromWebhook.mockResolvedValue({
      ok: false,
      error: 'missing subscription reference',
    })
    const payload = {
      id: 'evt_error',
      event: 'PAYMENT_CONFIRMED',
      payment: { id: 'pay_err', billingType: 'CREDIT_CARD' },
    }
    const { POST } = await import('@/app/api/webhooks/asaas/route')

    const response = await POST(webhookRequest(payload))
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json).toMatchObject({
      success: false,
      error: { code: 'internal_error', message: 'Could not process webhook' },
    })
    expect(mocks.markFailed).toHaveBeenCalledWith(
      'evt_error',
      'missing subscription reference',
    )
  })

  it('marks a subscription past due when a recurring payment is overdue', async () => {
    const payload = {
      id: 'evt_overdue_1',
      event: 'PAYMENT_OVERDUE',
      payment: {
        id: 'pay_overdue_1',
        subscription: 'sub_failed_123',
        billingType: 'CREDIT_CARD',
      },
    }
    const { POST } = await import('@/app/api/webhooks/asaas/route')

    const response = await POST(webhookRequest(payload))

    expect(response.status).toBe(200)
    expect(mocks.markSubscriptionPastDueFromWebhook).toHaveBeenCalledWith(
      expect.anything(),
      'sub_failed_123',
    )
    expect(mocks.markProcessed).toHaveBeenCalledWith('evt_overdue_1')
  })

  it('expires the subscription when a payment is refunded', async () => {
    const payload = {
      id: 'evt_refund_1',
      event: 'PAYMENT_REFUNDED',
      payment: {
        id: 'pay_refund_1',
        subscription: 'sub_refund_123',
        billingType: 'CREDIT_CARD',
      },
    }
    const { POST } = await import('@/app/api/webhooks/asaas/route')

    const response = await POST(webhookRequest(payload))

    expect(response.status).toBe(200)
    expect(mocks.expireSubscriptionFromRefund).toHaveBeenCalledWith(
      expect.anything(),
      payload,
    )
    expect(mocks.markProcessed).toHaveBeenCalledWith('evt_refund_1')
  })
})
