import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const insert = vi.fn()
  return {
    insert,
    from: vi.fn(() => ({ insert })),
    getCurrentUser: vi.fn(),
    getServerEnv: vi.fn(),
    createSupabaseServiceClient: vi.fn(),
    track: vi.fn(),
  }
})

const mockStripeCreate = vi.fn()
vi.mock('stripe', () => {
  return {
    default: function () {
      return {
        checkout: {
          sessions: {
            create: mockStripeCreate,
          },
        },
      }
    },
  }
})

vi.mock('@/lib/auth/roles', () => ({
  getCurrentUser: mocks.getCurrentUser,
}))

vi.mock('@/lib/env/server', () => ({
  getServerEnv: mocks.getServerEnv,
}))

vi.mock('@/lib/db/server', () => ({
  createSupabaseServiceClient: mocks.createSupabaseServiceClient,
}))

vi.mock('@/features/analytics/product-events-server', () => ({
  track: mocks.track,
}))

function request(body: unknown) {
  return new NextRequest('http://localhost/api/billing/checkout', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

describe('POST /api/billing/checkout', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    mocks.getServerEnv.mockReturnValue({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
      SUPABASE_SERVICE_ROLE_KEY: 'service',
      STRIPE_SECRET_KEY: 'sk_live_test_stripe_secret',
      STRIPE_WEBHOOK_SECRET: 'whsec_test',
      STRIPE_MONTHLY_PRICE_ID: 'price_monthly',
      STRIPE_ANNUAL_PRICE_ID: 'price_annual',
      NEXT_PUBLIC_APP_URL: 'https://aprovaenf.test',
    })
    mocks.getCurrentUser.mockResolvedValue({
      id: '00000000-0000-0000-0000-0000000000a4',
      email: 'aluno@aprovaenf.local',
      role: 'student',
    })
    mocks.createSupabaseServiceClient.mockReturnValue({ from: mocks.from })
    mocks.insert.mockResolvedValue({ error: null })
    mocks.track.mockResolvedValue({ ok: true })
    mockStripeCreate.mockResolvedValue({
      id: 'cs_test_annual',
      url: 'https://checkout.stripe.com/pay/cs_test_annual',
      status: 'open',
    })
  })

  it('creates an annual Stripe checkout session and records checkout_started', async () => {
    const { POST } = await import('@/app/api/billing/checkout/route')

    const response = await POST(request({ plan: 'annual' }))
    const json = await response.json()

    expect(response.status).toBe(201)
    expect(json.success).toBe(true)
    expect(json.data).toMatchObject({
      checkout_id: 'cs_test_annual',
      checkout_url: 'https://checkout.stripe.com/pay/cs_test_annual',
      plan: 'annual',
      amount_cents: 28700,
    })
    expect(json.data.subscription_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    )

    expect(mockStripeCreate).toHaveBeenCalledTimes(1)
    expect(mockStripeCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        payment_method_types: ['card', 'pix'],
        line_items: [{ price: 'price_annual', quantity: 1 }],
        mode: 'subscription',
        customer_email: 'aluno@aprovaenf.local',
        client_reference_id: json.data.subscription_id,
        metadata: {
          user_id: '00000000-0000-0000-0000-0000000000a4',
          subscription_id: json.data.subscription_id,
          plan: 'annual',
        },
      }),
    )

    expect(mocks.from).toHaveBeenCalledWith('subscriptions')
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: json.data.subscription_id,
        user_id: '00000000-0000-0000-0000-0000000000a4',
        plan: 'annual',
        status: 'pending',
        provider: 'stripe',
      }),
    )
    expect(mocks.track).toHaveBeenCalledWith(
      expect.objectContaining({
        event_name: 'checkout_started',
        user_id: '00000000-0000-0000-0000-0000000000a4',
        metadata: expect.objectContaining({
          plan: 'annual',
          checkout_id: 'cs_test_annual',
        }),
      }),
    )
  })

  it('creates a monthly Stripe checkout session', async () => {
    mockStripeCreate.mockResolvedValue({
      id: 'cs_test_monthly',
      url: 'https://checkout.stripe.com/pay/cs_test_monthly',
      status: 'open',
    })
    const { POST } = await import('@/app/api/billing/checkout/route')

    const response = await POST(request({ plan: 'monthly' }))
    const json = await response.json()

    expect(response.status).toBe(201)
    expect(json.data.plan).toBe('monthly')
    expect(json.data.checkout_id).toBe('cs_test_monthly')
    expect(mockStripeCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [{ price: 'price_monthly', quantity: 1 }],
      }),
    )
  })

  it('bypasses real Stripe integration and returns a mock checkout in development mode', async () => {
    mocks.getServerEnv.mockReturnValue({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
      SUPABASE_SERVICE_ROLE_KEY: 'service',
      STRIPE_SECRET_KEY: 'stripe_dev_mock_secret_key',
      STRIPE_WEBHOOK_SECRET: 'whsec_test',
      NEXT_PUBLIC_APP_URL: 'https://aprovaenf.test',
    })

    const { POST } = await import('@/app/api/billing/checkout/route')
    const response = await POST(request({ plan: 'monthly' }))
    const json = await response.json()

    expect(response.status).toBe(201)
    expect(mockStripeCreate).not.toHaveBeenCalled()
    expect(json.data.checkout_id).toContain('checkout_mock_')
    expect(json.data.checkout_url).toContain('checkout=mock')
    expect(json.data.checkout_url).toContain('provider=stripe')
  })

  it('rejects unauthenticated users before creating a provider checkout', async () => {
    mocks.getCurrentUser.mockResolvedValue(null)
    const { POST } = await import('@/app/api/billing/checkout/route')

    const response = await POST(request({ plan: 'monthly' }))
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json).toMatchObject({
      success: false,
      error: { code: 'unauthenticated' },
    })
    expect(mockStripeCreate).not.toHaveBeenCalled()
    expect(mocks.insert).not.toHaveBeenCalled()
  })

  it('rejects invalid plans', async () => {
    const { POST } = await import('@/app/api/billing/checkout/route')

    const response = await POST(request({ plan: 'lifetime' }))
    const json = await response.json()

    expect(response.status).toBe(422)
    expect(json).toMatchObject({
      success: false,
      error: { code: 'validation_error' },
    })
    expect(mockStripeCreate).not.toHaveBeenCalled()
  })

  it('returns a provider error status when Stripe creation throws an error in production', async () => {
    mockStripeCreate.mockRejectedValue(new Error('Stripe API is down'))
    const { POST } = await import('@/app/api/billing/checkout/route')

    const response = await POST(request({ plan: 'monthly' }))
    const json = await response.json()

    expect(response.status).toBe(502)
    expect(json).toMatchObject({
      success: false,
      error: {
        code: 'internal_error',
        message: 'Could not create checkout',
      },
    })
  })
})
