import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const maybeSingle = vi.fn()
  const chain = {
    select: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    maybeSingle,
  }
  chain.select.mockReturnValue(chain)
  chain.eq.mockReturnValue(chain)
  chain.in.mockReturnValue(chain)
  chain.order.mockReturnValue(chain)
  chain.limit.mockReturnValue(chain)
  return {
    chain,
    maybeSingle,
    from: vi.fn(() => chain),
    getCurrentUser: vi.fn(),
    getServerEnv: vi.fn(),
    createSupabaseServiceClient: vi.fn(),
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

describe('POST /api/billing/cancel', () => {
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
    mocks.maybeSingle.mockResolvedValue({
      data: {
        id: '00000000-0000-0000-0000-00000000b111',
        provider_subscription_id: 'sub_123',
        current_period_end: '2027-07-06T12:00:00.000Z',
      },
      error: null,
    })
    mocks.fetch.mockResolvedValue(
      new Response(JSON.stringify({ deleted: true }), { status: 200 }),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('cancels the recurring Asaas subscription and keeps access until the period end', async () => {
    const { POST } = await import('@/app/api/billing/cancel/route')

    const response = await POST()
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toMatchObject({
      success: true,
      data: {
        canceled: true,
        access_until: '2027-07-06T12:00:00.000Z',
      },
    })
    expect(mocks.from).toHaveBeenCalledWith('subscriptions')
    expect(mocks.chain.eq).toHaveBeenCalledWith(
      'user_id',
      '00000000-0000-0000-0000-0000000000a4',
    )
    expect(mocks.chain.eq).toHaveBeenCalledWith('provider', 'asaas')

    expect(mocks.fetch).toHaveBeenCalledTimes(1)
    const [url, init] = mocks.fetch.mock.calls[0]
    expect(url).toBe('https://api.asaas.com/v3/subscriptions/sub_123')
    expect((init as RequestInit).method).toBe('DELETE')
  })

  it('does not call Asaas for a Pix purchase (nothing recurring to cancel)', async () => {
    mocks.maybeSingle.mockResolvedValue({
      data: {
        id: '00000000-0000-0000-0000-00000000b111',
        provider_subscription_id: 'chk_pix_checkout',
        current_period_end: '2027-07-06T12:00:00.000Z',
      },
      error: null,
    })
    const { POST } = await import('@/app/api/billing/cancel/route')

    const response = await POST()
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.canceled).toBe(true)
    expect(mocks.fetch).not.toHaveBeenCalled()
  })

  it('rejects unauthenticated users', async () => {
    mocks.getCurrentUser.mockResolvedValue(null)
    const { POST } = await import('@/app/api/billing/cancel/route')

    const response = await POST()
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json).toMatchObject({
      success: false,
      error: { code: 'unauthenticated' },
    })
    expect(mocks.fetch).not.toHaveBeenCalled()
  })

  it('returns not found when the user has no active subscription', async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null })
    const { POST } = await import('@/app/api/billing/cancel/route')

    const response = await POST()
    const json = await response.json()

    expect(response.status).toBe(404)
    expect(json).toMatchObject({
      success: false,
      error: { code: 'not_found' },
    })
    expect(mocks.fetch).not.toHaveBeenCalled()
  })

  it('returns a provider error when the Asaas cancellation fails', async () => {
    mocks.fetch.mockResolvedValue(
      new Response(JSON.stringify({ errors: [{ code: 'invalid' }] }), {
        status: 400,
      }),
    )
    const { POST } = await import('@/app/api/billing/cancel/route')

    const response = await POST()
    const json = await response.json()

    expect(response.status).toBe(502)
    expect(json).toMatchObject({
      success: false,
      error: { code: 'internal_error' },
    })
  })
})
