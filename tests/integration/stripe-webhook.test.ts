import { NextRequest } from 'next/server'
import Stripe from 'stripe'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createSupabaseServiceClient: vi.fn(),
  getServerEnv: vi.fn(),
  createPaymentEventRepository: vi.fn(),
  recordReceived: vi.fn(),
  markProcessed: vi.fn(),
  markFailed: vi.fn(),
  activateSubscriptionFromWebhook: vi.fn(),
  cancelSubscriptionFromWebhook: vi.fn(),
  markSubscriptionPastDueFromWebhook: vi.fn(),
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
  cancelSubscriptionFromWebhook: mocks.cancelSubscriptionFromWebhook,
  markSubscriptionPastDueFromWebhook: mocks.markSubscriptionPastDueFromWebhook,
}))

vi.mock('@/features/analytics/product-events-server', () => ({
  track: mocks.track,
}))

const SECRET_KEY_DEV = 'stripe_dev_mock_secret_key'
const WEBHOOK_SECRET = 'whsec_test_secret'

function webhookRequest(rawBody: string, options?: { signature?: string }) {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  }
  if (options?.signature !== undefined) {
    headers['stripe-signature'] = options.signature
  }
  return new NextRequest('http://localhost/api/webhooks/stripe', {
    method: 'POST',
    body: rawBody,
    headers,
  })
}

function signedWebhookRequest(payload: unknown) {
  const rawBody = JSON.stringify(payload)
  const signature = Stripe.webhooks.generateTestHeaderString({
    payload: rawBody,
    secret: WEBHOOK_SECRET,
  })
  return webhookRequest(rawBody, { signature })
}

describe('POST /api/webhooks/stripe', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    mocks.getServerEnv.mockReturnValue({
      NODE_ENV: 'development',
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
      SUPABASE_SERVICE_ROLE_KEY: 'service',
      STRIPE_SECRET_KEY: SECRET_KEY_DEV,
      STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET,
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
    mocks.cancelSubscriptionFromWebhook.mockResolvedValue({ ok: true })
    mocks.markSubscriptionPastDueFromWebhook.mockResolvedValue({ ok: true })
    mocks.track.mockResolvedValue({ ok: true })
  })

  it('records, activates, marks processed, and tracks a signed completed checkout event', async () => {
    const payload = {
      id: 'evt_checkout_1',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_1',
          client_reference_id: '00000000-0000-0000-0000-00000000b111',
          customer: 'cus_1',
          subscription: 'sub_1',
          payment_status: 'paid',
          metadata: {
            user_id: '00000000-0000-0000-0000-0000000000a4',
            plan: 'annual',
          },
        },
      },
    }
    const { POST } = await import('@/app/api/webhooks/stripe/route')

    const response = await POST(signedWebhookRequest(payload))
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
      providerEventId: 'evt_checkout_1',
      eventType: 'checkout.session.completed',
      payload,
    })
    expect(mocks.activateSubscriptionFromWebhook).toHaveBeenCalledWith(
      expect.anything(),
      payload,
    )
    expect(mocks.markProcessed).toHaveBeenCalledWith('evt_checkout_1')
    expect(mocks.track).toHaveBeenCalledWith(
      expect.objectContaining({
        event_name: 'subscription_activated',
        user_id: '00000000-0000-0000-0000-0000000000a4',
        metadata: expect.objectContaining({
          plan: 'annual',
          provider_event_id: 'evt_checkout_1',
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
    const payload = { id: 'evt_duplicate', type: 'checkout.session.completed', data: {} }
    const { POST } = await import('@/app/api/webhooks/stripe/route')

    const response = await POST(signedWebhookRequest(payload))
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

  it('rejects requests without a Stripe signature even with a development key', async () => {
    const payload = { id: 'evt_no_sig', type: 'checkout.session.completed', data: {} }
    const { POST } = await import('@/app/api/webhooks/stripe/route')

    const response = await POST(webhookRequest(JSON.stringify(payload)))
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json).toMatchObject({
      success: false,
      error: { code: 'unauthenticated' },
    })
    expect(mocks.recordReceived).not.toHaveBeenCalled()
  })

  it('records processing errors and returns 500 so Stripe can retry', async () => {
    mocks.activateSubscriptionFromWebhook.mockResolvedValue({
      ok: false,
      error: 'missing subscription reference',
    })
    const payload = {
      id: 'evt_error',
      type: 'checkout.session.completed',
      data: {
        object: { id: 'cs_err' },
      },
    }
    const { POST } = await import('@/app/api/webhooks/stripe/route')

    const response = await POST(signedWebhookRequest(payload))
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

  it('handles customer.subscription.deleted to expire subscriptions', async () => {
    const payload = {
      id: 'evt_deleted_1',
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_deleted_123',
        },
      },
    }
    const { POST } = await import('@/app/api/webhooks/stripe/route')

    const response = await POST(signedWebhookRequest(payload))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toMatchObject({
      success: true,
      data: {
        received: true,
        duplicate: false,
        activated: false,
      },
    })
    expect(mocks.cancelSubscriptionFromWebhook).toHaveBeenCalledWith(expect.anything(), 'sub_deleted_123')
    expect(mocks.markProcessed).toHaveBeenCalledWith('evt_deleted_1')
  })

  it('marks a subscription past due when a recurring invoice payment fails', async () => {
    const payload = {
      id: 'evt_payment_failed_1',
      type: 'invoice.payment_failed',
      data: {
        object: {
          id: 'in_failed_1',
          parent: {
            subscription_details: {
              subscription: 'sub_failed_123',
            },
          },
        },
      },
    }
    const { POST } = await import('@/app/api/webhooks/stripe/route')

    const response = await POST(signedWebhookRequest(payload))

    expect(response.status).toBe(200)
    expect(mocks.markSubscriptionPastDueFromWebhook).toHaveBeenCalledWith(
      expect.anything(),
      'sub_failed_123',
    )
    expect(mocks.markProcessed).toHaveBeenCalledWith('evt_payment_failed_1')
  })
})
