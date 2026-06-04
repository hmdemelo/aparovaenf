import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  exchangeCodeForSession: vi.fn(),
  getCurrentUser: vi.fn(),
  getLaunchCareerSlug: vi.fn(),
  isSubscriber: vi.fn(),
}))

vi.mock('@/lib/db/server', () => ({
  createSupabaseServerClient: mocks.createSupabaseServerClient,
}))

vi.mock('@/lib/auth/roles', () => ({
  getCurrentUser: mocks.getCurrentUser,
  isSubscriber: mocks.isSubscriber,
}))

vi.mock('@/lib/db/launch-career', () => ({
  getLaunchCareerSlug: mocks.getLaunchCareerSlug,
}))

function request(path: string) {
  return new NextRequest(`http://localhost${path}`)
}

describe('GET /api/auth/callback', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    mocks.exchangeCodeForSession.mockResolvedValue({ error: null })
    mocks.createSupabaseServerClient.mockResolvedValue({
      auth: { exchangeCodeForSession: mocks.exchangeCodeForSession },
    })
    mocks.getCurrentUser.mockResolvedValue({
      id: '00000000-0000-0000-0000-0000000000a4',
      email: 'aluno@aprovaenf.local',
      role: 'student',
    })
    mocks.isSubscriber.mockResolvedValue(true)
    mocks.getLaunchCareerSlug.mockResolvedValue('enfermeiro-a')
  })

  it('exchanges a callback code and redirects to a safe requested path', async () => {
    const { GET } = await import('@/app/api/auth/callback/route')

    const response = await GET(
      request('/api/auth/callback?code=oauth-code&next=%2Ffeed%3Fcareer%3Denfermeiro-a'),
    )

    expect(mocks.exchangeCodeForSession).toHaveBeenCalledWith('oauth-code')
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'http://localhost/feed?career=enfermeiro-a',
    )
  })

  it('does not honor protocol-relative next values', async () => {
    const { GET } = await import('@/app/api/auth/callback/route')

    const response = await GET(
      request('/api/auth/callback?code=oauth-code&next=%2F%2Fevil.example%2Ffeed'),
    )

    expect(response.headers.get('location')).toBe(
      'http://localhost/feed?career=enfermeiro-a',
    )
  })

  it('redirects expired or invalid links back to login without leaking provider errors', async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({
      error: new Error('invalid request: token expired'),
    })
    const { GET } = await import('@/app/api/auth/callback/route')

    const response = await GET(
      request('/api/auth/callback?code=expired-code&next=%2Ffeed%3Fcareer%3Denfermeiro-a'),
    )
    const location = response.headers.get('location') ?? ''

    expect(location).toContain('/login')
    expect(location).toContain('auth_error=invalid_link')
    expect(location).toContain('next=%2Ffeed%3Fcareer%3Denfermeiro-a')
    expect(location).not.toContain('token%20expired')
  })

  it('rejects callbacks without a code before calling Supabase', async () => {
    const { GET } = await import('@/app/api/auth/callback/route')

    const response = await GET(request('/api/auth/callback?next=%2Ffeed'))

    expect(mocks.exchangeCodeForSession).not.toHaveBeenCalled()
    expect(response.headers.get('location')).toContain('/login')
    expect(response.headers.get('location')).toContain('auth_error=missing_code')
  })
})
