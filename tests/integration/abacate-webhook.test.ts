import { createHmac } from 'node:crypto'
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
}))

vi.mock('@/features/analytics/product-events-server', () => ({
  track: mocks.track,
}))

const PUBLIC_KEY = 'test-abacate-public-key'
const FIXTURE_HMAC_KEY = 'test-webhook-secret'

function signature(rawBody: string) {
  return createHmac('sha256', PUBLIC_KEY)
    .update(Buffer.from(rawBody, 'utf8'))
    .digest('base64')
}

function webhookRequest(rawBody: string, options?: { webhookKey?: string; signature?: string }) {
  const secret = options?.webhookKey ?? FIXTURE_HMAC_KEY
  return new NextRequest(
    `http://localhost/api/webhooks/abacate-pay?webhookSecret=${secret}`,
    {
      method: 'POST',
      body: rawBody,
      headers: {
        'content-type': 'application/json',
        'x-webhook-signature': options?.signature ?? signature(rawBody),
      },
    },
  )
}

describe('POST /api/webhooks/abacate-pay', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    mocks.getServerEnv.mockReturnValue({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
      SUPABASE_SERVICE_ROLE_KEY: 'service',
      ABACATE_PAY_API_KEY: 'abacate-secret',
      ABACATE_PAY_WEBHOOK_FIXTURE_HMAC_KEY: FIXTURE_HMAC_KEY,
      ABACATE_PAY_WEBHOOK_PUBLIC_KEY: PUBLIC_KEY,
      NEXT_PUBLIC_APP_URL: 'https://aprovaenf.test',
    })
    mocks.createSupabaseServiceClient.mockReturnValue({ db: true })
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
      userId: '00000000-0000-0000-0000-0000000000a4',
      plan: 'annual',
      subscriptionId: '00000000-0000-0000-0000-00000000b111',
    })
    mocks.track.mockResolvedValue({ ok: true })
  })

  it('records, activates, marks processed, and tracks a completed checkout event', async () => {
    const payload = {
      id: 'log_checkout_1',
      event: 'checkout.completed',
      data: {
        checkout: {
          id: 'bill_1',
          externalId: '00000000-0000-0000-0000-00000000b111',
          amount: 28700,
          status: 'PAID',
          metadata: {
            user_id: '00000000-0000-0000-0000-0000000000a4',
            plan: 'annual',
          },
        },
      },
    }
    const rawBody = JSON.stringify(payload)
    const { POST } = await import('@/app/api/webhooks/abacate-pay/route')

    const response = await POST(webhookRequest(rawBody))
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
      providerEventId: 'log_checkout_1',
      eventType: 'checkout.completed',
      payload,
    })
    expect(mocks.activateSubscriptionFromWebhook).toHaveBeenCalledWith(
      expect.anything(),
      payload,
    )
    expect(mocks.markProcessed).toHaveBeenCalledWith('log_checkout_1')
    expect(mocks.track).toHaveBeenCalledWith(
      expect.objectContaining({
        event_name: 'subscription_activated',
        user_id: '00000000-0000-0000-0000-0000000000a4',
        metadata: expect.objectContaining({
          plan: 'annual',
          provider_event_id: 'log_checkout_1',
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
    const payload = { id: 'log_duplicate', event: 'subscription.completed', data: {} }
    const { POST } = await import('@/app/api/webhooks/abacate-pay/route')

    const response = await POST(webhookRequest(JSON.stringify(payload)))
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

  it('rejects requests with an invalid webhook secret before touching storage', async () => {
    const payload = { id: 'log_bad_secret', event: 'checkout.completed', data: {} }
    const { POST } = await import('@/app/api/webhooks/abacate-pay/route')

    const response = await POST(
      webhookRequest(JSON.stringify(payload), { webhookKey: 'wrong-key' }),
    )
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json).toMatchObject({
      success: false,
      error: { code: 'unauthenticated' },
    })
    expect(mocks.recordReceived).not.toHaveBeenCalled()
  })

  it('rejects requests with an invalid HMAC signature', async () => {
    const payload = { id: 'log_bad_sig', event: 'checkout.completed', data: {} }
    const { POST } = await import('@/app/api/webhooks/abacate-pay/route')

    const response = await POST(
      webhookRequest(JSON.stringify(payload), { signature: 'not-valid' }),
    )
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json).toMatchObject({
      success: false,
      error: { code: 'unauthenticated' },
    })
    expect(mocks.recordReceived).not.toHaveBeenCalled()
  })

  it('rejects signed requests when the webhook public key is not configured', async () => {
    mocks.getServerEnv.mockReturnValue({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
      SUPABASE_SERVICE_ROLE_KEY: 'service',
      ABACATE_PAY_API_KEY: 'abacate-secret',
      ABACATE_PAY_WEBHOOK_FIXTURE_HMAC_KEY: FIXTURE_HMAC_KEY,
      NEXT_PUBLIC_APP_URL: 'https://aprovaenf.test',
    })
    const payload = { id: 'log_missing_key', event: 'checkout.completed', data: {} }
    const { POST } = await import('@/app/api/webhooks/abacate-pay/route')

    const response = await POST(webhookRequest(JSON.stringify(payload)))
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json).toMatchObject({
      success: false,
      error: { code: 'unauthenticated' },
    })
    expect(mocks.recordReceived).not.toHaveBeenCalled()
  })

  it('records processing errors and returns 500 so Abacate Pay can retry', async () => {
    mocks.activateSubscriptionFromWebhook.mockResolvedValue({
      ok: false,
      error: 'missing subscription reference',
    })
    const payload = { id: 'log_error', event: 'subscription.completed', data: {} }
    const { POST } = await import('@/app/api/webhooks/abacate-pay/route')

    const response = await POST(webhookRequest(JSON.stringify(payload)))
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json).toMatchObject({
      success: false,
      error: { code: 'internal_error', message: 'Could not process webhook' },
    })
    expect(mocks.markFailed).toHaveBeenCalledWith(
      'log_error',
      'missing subscription reference',
    )
  })
})
