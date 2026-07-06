import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const insert = vi.fn()
  const gte = vi.fn()
  const countChain = {
    eq: vi.fn(),
    gte,
  }
  countChain.eq.mockReturnValue(countChain)
  const select = vi.fn(() => countChain)
  const updateEqStatus = vi.fn()
  const updateChain = {
    eq: vi.fn(() => ({ eq: updateEqStatus })),
  }
  const update = vi.fn(() => updateChain)
  return {
    insert,
    gte,
    select,
    update,
    updateEqStatus,
    from: vi.fn(() => ({ insert, select, update })),
    getCurrentUser: vi.fn(),
    getServerEnv: vi.fn(),
    createSupabaseServiceClient: vi.fn(),
    track: vi.fn(),
    fetch: vi.fn(),
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

function asaasCheckoutResponse(id: string) {
  return new Response(
    JSON.stringify({
      id,
      link: `https://asaas.com/checkout/${id}`,
      status: 'ACTIVE',
    }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  )
}

function sentCheckoutBody(callIndex = 0) {
  const init = mocks.fetch.mock.calls[callIndex][1] as RequestInit
  return JSON.parse(String(init.body))
}

describe('POST /api/billing/checkout', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.stubGlobal('fetch', mocks.fetch)

    mocks.getServerEnv.mockReturnValue({
      NODE_ENV: 'production',
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
      SUPABASE_SERVICE_ROLE_KEY: 'service',
      ASAAS_API_KEY: '$aact_prod_example_key',
      ASAAS_WEBHOOK_TOKEN: 'webhook-token-of-16chars',
      NEXT_PUBLIC_APP_URL: 'https://aprovaenf.test',
    })
    mocks.getCurrentUser.mockResolvedValue({
      id: '00000000-0000-0000-0000-0000000000a4',
      email: 'aluno@aprovaenf.local',
      role: 'student',
    })
    mocks.createSupabaseServiceClient.mockReturnValue({ from: mocks.from })
    mocks.insert.mockResolvedValue({ error: null })
    mocks.gte.mockResolvedValue({ count: 0, error: null })
    mocks.updateEqStatus.mockResolvedValue({ error: null })
    mocks.track.mockResolvedValue({ ok: true })
    mocks.fetch.mockResolvedValue(asaasCheckoutResponse('chk_test_annual'))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('creates a recurring annual card checkout at Asaas and records checkout_started', async () => {
    const { POST } = await import('@/app/api/billing/checkout/route')

    const response = await POST(request({ plan: 'annual' }))
    const json = await response.json()

    expect(response.status).toBe(201)
    expect(json.success).toBe(true)
    expect(json.data).toMatchObject({
      checkout_id: 'chk_test_annual',
      checkout_url: 'https://asaas.com/checkout/chk_test_annual',
      plan: 'annual',
      amount_cents: 28700,
    })
    expect(json.data.subscription_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    )

    expect(mocks.fetch).toHaveBeenCalledTimes(1)
    const [url, init] = mocks.fetch.mock.calls[0]
    expect(url).toBe('https://api.asaas.com/v3/checkouts')
    expect((init as RequestInit).method).toBe('POST')
    expect(
      (init as RequestInit & { headers: Record<string, string> }).headers
        .access_token,
    ).toBe('$aact_prod_example_key')

    const body = sentCheckoutBody()
    expect(body).toMatchObject({
      billingTypes: ['CREDIT_CARD'],
      chargeTypes: ['RECURRENT'],
      subscription: { cycle: 'YEARLY' },
      externalReference: json.data.subscription_id,
      customerData: { email: 'aluno@aprovaenf.local' },
      items: [
        {
          name: 'AprovaENF PRO — Anual',
          quantity: 1,
          value: 287,
        },
      ],
    })
    expect(body.callback.successUrl).toBe(
      'https://aprovaenf.test/feed?subscription=success',
    )

    expect(mocks.from).toHaveBeenCalledWith('subscriptions')
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: json.data.subscription_id,
        user_id: '00000000-0000-0000-0000-0000000000a4',
        plan: 'annual',
        status: 'pending',
        provider: 'asaas',
      }),
    )
    // O id do checkout fica na linha pendente para correlacionar o webhook.
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({ provider_subscription_id: 'chk_test_annual' }),
    )
    expect(mocks.track).toHaveBeenCalledWith(
      expect.objectContaining({
        event_name: 'checkout_started',
        user_id: '00000000-0000-0000-0000-0000000000a4',
        metadata: expect.objectContaining({
          plan: 'annual',
          checkout_id: 'chk_test_annual',
        }),
      }),
    )
  })

  it('creates a one-time Pix checkout (no recurrence)', async () => {
    mocks.fetch.mockResolvedValue(asaasCheckoutResponse('chk_test_pix'))
    const { POST } = await import('@/app/api/billing/checkout/route')

    const response = await POST(
      request({ plan: 'annual', payment_method: 'pix' }),
    )
    const json = await response.json()

    expect(response.status).toBe(201)
    expect(json.data).toMatchObject({
      checkout_id: 'chk_test_pix',
      plan: 'annual',
      amount_cents: 28700,
    })

    const body = sentCheckoutBody()
    expect(body).toMatchObject({
      billingTypes: ['PIX'],
      chargeTypes: ['DETACHED'],
      externalReference: json.data.subscription_id,
    })
    // Pix é pagamento avulso: nenhum ciclo de assinatura.
    expect(body.subscription).toBeUndefined()

    expect(mocks.track).toHaveBeenCalledWith(
      expect.objectContaining({
        event_name: 'checkout_started',
        metadata: expect.objectContaining({ payment_method: 'pix' }),
      }),
    )
  })

  it('rejects an unknown payment method', async () => {
    const { POST } = await import('@/app/api/billing/checkout/route')

    const response = await POST(
      request({ plan: 'monthly', payment_method: 'boleto' }),
    )

    expect(response.status).toBe(422)
    expect(mocks.fetch).not.toHaveBeenCalled()
    expect(mocks.insert).not.toHaveBeenCalled()
  })

  it('creates a monthly card checkout with a MONTHLY cycle', async () => {
    mocks.fetch.mockResolvedValue(asaasCheckoutResponse('chk_test_monthly'))
    const { POST } = await import('@/app/api/billing/checkout/route')

    const response = await POST(request({ plan: 'monthly' }))
    const json = await response.json()

    expect(response.status).toBe(201)
    expect(json.data.plan).toBe('monthly')
    expect(json.data.checkout_id).toBe('chk_test_monthly')

    const body = sentCheckoutBody()
    expect(body.subscription).toEqual({ cycle: 'MONTHLY' })
    expect(body.items[0].value).toBe(29.9)
  })

  it('uses the sandbox base URL for a sandbox API key', async () => {
    mocks.getServerEnv.mockReturnValue({
      NODE_ENV: 'development',
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
      SUPABASE_SERVICE_ROLE_KEY: 'service',
      ASAAS_API_KEY: '$aact_hmlg_example_key',
      ASAAS_WEBHOOK_TOKEN: 'webhook-token-of-16chars',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    })
    const { POST } = await import('@/app/api/billing/checkout/route')

    const response = await POST(request({ plan: 'monthly' }))

    expect(response.status).toBe(201)
    expect(mocks.fetch.mock.calls[0][0]).toBe(
      'https://api-sandbox.asaas.com/v3/checkouts',
    )
  })

  it('bypasses the real Asaas integration and returns a mock checkout in development mode', async () => {
    mocks.getServerEnv.mockReturnValue({
      NODE_ENV: 'development',
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
      SUPABASE_SERVICE_ROLE_KEY: 'service',
      ASAAS_API_KEY: 'asaas_dev_mock_api_key',
      ASAAS_WEBHOOK_TOKEN: 'webhook-token-of-16chars',
      NEXT_PUBLIC_APP_URL: 'https://aprovaenf.test',
    })

    const { POST } = await import('@/app/api/billing/checkout/route')
    const response = await POST(request({ plan: 'monthly' }))
    const json = await response.json()

    expect(response.status).toBe(201)
    expect(mocks.fetch).not.toHaveBeenCalled()
    expect(json.data.checkout_id).toContain('checkout_mock_')
    expect(json.data.checkout_url).toContain('checkout=mock')
    expect(json.data.checkout_url).toContain('subscription_id=')
    expect(json.data.checkout_url).not.toContain('user_id=')
    expect(json.data.checkout_url).not.toContain('plan=')
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
    expect(mocks.fetch).not.toHaveBeenCalled()
    expect(mocks.insert).not.toHaveBeenCalled()
  })

  it('rate limits checkout creation after too many recent pending attempts', async () => {
    mocks.gte.mockResolvedValue({ count: 5, error: null })
    const { POST } = await import('@/app/api/billing/checkout/route')

    const response = await POST(request({ plan: 'monthly' }))
    const json = await response.json()

    expect(response.status).toBe(429)
    expect(json).toMatchObject({
      success: false,
      error: { code: 'rate_limited' },
    })
    expect(mocks.fetch).not.toHaveBeenCalled()
    expect(mocks.insert).not.toHaveBeenCalled()
  })

  it('does not block checkout when the rate limit check itself fails', async () => {
    mocks.gte.mockResolvedValue({
      count: null,
      error: { message: 'count unavailable' },
    })
    const { POST } = await import('@/app/api/billing/checkout/route')

    const response = await POST(request({ plan: 'monthly' }))

    expect(response.status).toBe(201)
    expect(mocks.fetch).toHaveBeenCalledTimes(1)
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
    expect(mocks.fetch).not.toHaveBeenCalled()
  })

  it('returns a provider error status when the Asaas request fails', async () => {
    mocks.fetch.mockResolvedValue(
      new Response(JSON.stringify({ errors: [{ code: 'invalid' }] }), {
        status: 400,
      }),
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
  })

  it('does not fall back to mock checkout when a real Asaas key fails locally', async () => {
    mocks.getServerEnv.mockReturnValue({
      NODE_ENV: 'development',
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
      SUPABASE_SERVICE_ROLE_KEY: 'service',
      ASAAS_API_KEY: '$aact_hmlg_example_key',
      ASAAS_WEBHOOK_TOKEN: 'webhook-token-of-16chars',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    })
    mocks.fetch.mockRejectedValue(new Error('Asaas API is down'))
    const { POST } = await import('@/app/api/billing/checkout/route')

    const response = await POST(request({ plan: 'monthly' }))
    const json = await response.json()

    expect(response.status).toBe(502)
    expect(json.success).toBe(false)
  })
})
