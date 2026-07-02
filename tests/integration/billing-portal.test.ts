import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const maybeSingle = vi.fn()
  const chain = {
    select: vi.fn(),
    eq: vi.fn(),
    not: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    maybeSingle,
  }
  chain.select.mockReturnValue(chain)
  chain.eq.mockReturnValue(chain)
  chain.not.mockReturnValue(chain)
  chain.order.mockReturnValue(chain)
  chain.limit.mockReturnValue(chain)
  return {
    chain,
    maybeSingle,
    from: vi.fn(() => chain),
    getCurrentUser: vi.fn(),
    getServerEnv: vi.fn(),
    createSupabaseServiceClient: vi.fn(),
  }
})

const mockPortalCreate = vi.fn()
vi.mock('stripe', () => {
  return {
    default: function () {
      return {
        billingPortal: {
          sessions: {
            create: mockPortalCreate,
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

describe('POST /api/billing/portal', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    mocks.getServerEnv.mockReturnValue({
      NODE_ENV: 'production',
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
    mocks.maybeSingle.mockResolvedValue({
      data: { provider_customer_id: 'cus_123' },
      error: null,
    })
    mockPortalCreate.mockResolvedValue({
      id: 'bps_1',
      url: 'https://billing.stripe.com/p/session_123',
    })
  })

  it('creates a billing portal session for the subscriber Stripe customer', async () => {
    const { POST } = await import('@/app/api/billing/portal/route')

    const response = await POST()
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toMatchObject({
      success: true,
      data: { portal_url: 'https://billing.stripe.com/p/session_123' },
    })
    expect(mocks.from).toHaveBeenCalledWith('subscriptions')
    expect(mocks.chain.eq).toHaveBeenCalledWith(
      'user_id',
      '00000000-0000-0000-0000-0000000000a4',
    )
    expect(mocks.chain.eq).toHaveBeenCalledWith('provider', 'stripe')
    expect(mockPortalCreate).toHaveBeenCalledWith({
      customer: 'cus_123',
      return_url: 'https://aprovaenf.test/feed',
    })
  })

  it('rejects unauthenticated users', async () => {
    mocks.getCurrentUser.mockResolvedValue(null)
    const { POST } = await import('@/app/api/billing/portal/route')

    const response = await POST()
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json).toMatchObject({
      success: false,
      error: { code: 'unauthenticated' },
    })
    expect(mockPortalCreate).not.toHaveBeenCalled()
  })

  it('returns not found when the user has no Stripe customer', async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null })
    const { POST } = await import('@/app/api/billing/portal/route')

    const response = await POST()
    const json = await response.json()

    expect(response.status).toBe(404)
    expect(json).toMatchObject({
      success: false,
      error: { code: 'not_found' },
    })
    expect(mockPortalCreate).not.toHaveBeenCalled()
  })

  it('is unavailable in mock checkout mode', async () => {
    mocks.getServerEnv.mockReturnValue({
      NODE_ENV: 'development',
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
      SUPABASE_SERVICE_ROLE_KEY: 'service',
      STRIPE_SECRET_KEY: 'stripe_dev_mock_secret_key',
      STRIPE_WEBHOOK_SECRET: 'whsec_test',
      NEXT_PUBLIC_APP_URL: 'https://aprovaenf.test',
    })
    const { POST } = await import('@/app/api/billing/portal/route')

    const response = await POST()
    const json = await response.json()

    expect(response.status).toBe(404)
    expect(json.success).toBe(false)
    expect(mockPortalCreate).not.toHaveBeenCalled()
  })

  it('returns a provider error when Stripe fails', async () => {
    mockPortalCreate.mockRejectedValue(new Error('Stripe API is down'))
    const { POST } = await import('@/app/api/billing/portal/route')

    const response = await POST()
    const json = await response.json()

    expect(response.status).toBe(502)
    expect(json).toMatchObject({
      success: false,
      error: { code: 'internal_error' },
    })
  })
})
