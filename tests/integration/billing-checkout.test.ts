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
      ABACATE_PAY_API_KEY: 'abacate-secret',
      ABACATE_PAY_WEBHOOK_SECRET: 'webhook-secret',
      ABACATE_PAY_MONTHLY_PRODUCT_ID: 'prod_monthly',
      ABACATE_PAY_ANNUAL_PRODUCT_ID: 'prod_annual',
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
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        Response.json({
          success: true,
          error: null,
          data: {
            id: 'bill_annual',
            url: 'https://app.abacatepay.com/pay/bill_annual',
            amount: 28700,
            status: 'PENDING',
          },
        }),
      ),
    )
  })

  it('creates an annual checkout server-side and records checkout_started', async () => {
    const { POST } = await import('@/app/api/billing/checkout/route')

    const response = await POST(request({ plan: 'annual' }))
    const json = await response.json()

    expect(response.status).toBe(201)
    expect(json.success).toBe(true)
    expect(json.data).toMatchObject({
      checkout_id: 'bill_annual',
      checkout_url: 'https://app.abacatepay.com/pay/bill_annual',
      plan: 'annual',
      amount_cents: 28700,
    })
    expect(json.data.subscription_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    )

    expect(fetch).toHaveBeenCalledTimes(1)
    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(url).toBe('https://api.abacatepay.com/v2/checkouts/create')
    expect(init?.headers).toMatchObject({
      Authorization: 'Bearer abacate-secret',
      'Content-Type': 'application/json',
    })
    const providerBody = JSON.parse(String(init?.body))
    expect(providerBody).toMatchObject({
      items: [{ id: 'prod_annual', quantity: 1 }],
      methods: ['PIX', 'CARD'],
      card: { maxInstallments: 12 },
      returnUrl: 'https://aprovaenf.test/feed',
      completionUrl: 'https://aprovaenf.test/feed?subscription=success',
      metadata: {
        user_id: '00000000-0000-0000-0000-0000000000a4',
        plan: 'annual',
      },
    })
    expect(providerBody.externalId).toBe(json.data.subscription_id)
    expect(providerBody.metadata.subscription_id).toBe(json.data.subscription_id)

    expect(mocks.from).toHaveBeenCalledWith('subscriptions')
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: json.data.subscription_id,
        user_id: '00000000-0000-0000-0000-0000000000a4',
        plan: 'annual',
        status: 'pending',
        provider: 'abacate_pay',
      }),
    )
    expect(mocks.track).toHaveBeenCalledWith(
      expect.objectContaining({
        event_name: 'checkout_started',
        user_id: '00000000-0000-0000-0000-0000000000a4',
        metadata: expect.objectContaining({
          plan: 'annual',
          checkout_id: 'bill_annual',
        }),
      }),
    )
  })

  it('uses the Abacate subscription checkout endpoint for monthly plans', async () => {
    const { POST } = await import('@/app/api/billing/checkout/route')

    const response = await POST(request({ plan: 'monthly' }))
    const json = await response.json()

    expect(response.status).toBe(201)
    expect(json.data.plan).toBe('monthly')
    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(url).toBe('https://api.abacatepay.com/v2/subscriptions/create')
    const providerBody = JSON.parse(String(init?.body))
    expect(providerBody.items).toEqual([{ id: 'prod_monthly', quantity: 1 }])
    expect(providerBody.methods).toEqual(['CARD'])
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
    expect(fetch).not.toHaveBeenCalled()
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
    expect(fetch).not.toHaveBeenCalled()
  })

  it('returns a provider error without leaking the Abacate secret', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        Response.json(
          { success: false, error: { message: 'invalid api key' }, data: null },
          { status: 401 },
        ),
      ),
    )
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
    expect(JSON.stringify(json)).not.toContain('abacate-secret')
  })
})
