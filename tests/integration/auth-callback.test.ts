import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  exchangeCodeForSession: vi.fn(),
  getUser: vi.fn(),
  from: vi.fn(),
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
    mocks.getUser.mockResolvedValue({
      data: {
        user: {
          id: '00000000-0000-0000-0000-0000000000a4',
          email: 'aluno@aprovaenf.local',
          app_metadata: { provider: 'email' },
        },
      },
      error: null,
    })

    const selectMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            role: 'student',
            registration_completed: true,
          },
          error: null,
        }),
      }),
    })

    mocks.from.mockReturnValue({
      select: selectMock,
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    })

    mocks.createSupabaseServerClient.mockResolvedValue({
      auth: {
        exchangeCodeForSession: mocks.exchangeCodeForSession,
        getUser: mocks.getUser,
      },
      from: mocks.from,
    })

    mocks.getCurrentUser.mockResolvedValue({
      id: '00000000-0000-0000-0000-0000000000a4',
      email: 'aluno@aprovaenf.local',
      role: 'student',
      registrationCompleted: true,
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

  it('redirects standard magic link user with incomplete registration to /completar-cadastro', async () => {
    // Setup getUser mock for standard email user
    mocks.getUser.mockResolvedValue({
      data: {
        user: {
          id: '00000000-0000-0000-0000-0000000000a4',
          email: 'aluno@aprovaenf.local',
          app_metadata: { provider: 'email', providers: ['email'] },
        },
      },
      error: null,
    })

    // Setup profile to return registration_completed: false
    const selectMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            role: 'student',
            registration_completed: false,
          },
          error: null,
        }),
      }),
    })
    mocks.from.mockReturnValue({
      select: selectMock,
    })

    const { GET } = await import('@/app/api/auth/callback/route')

    const response = await GET(
      request('/api/auth/callback?code=magic-link-code&next=%2Ffeed%3Fcareer%3Denfermeiro-a'),
    )

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'http://localhost/completar-cadastro?next=%2Ffeed%3Fcareer%3Denfermeiro-a',
    )
  })

  it('auto-completes registration and redirects Google OAuth logins directly to feed', async () => {
    // Setup getUser mock for Google user
    mocks.getUser.mockResolvedValue({
      data: {
        user: {
          id: '00000000-0000-0000-0000-0000000000a4',
          email: 'aluno-google@aprovaenf.local',
          app_metadata: { provider: 'google', providers: ['google'] },
        },
      },
      error: null,
    })

    // Setup profile mock (not completed initially)
    const selectMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            role: 'student',
            registration_completed: false,
          },
          error: null,
        }),
      }),
    })
    const updateEqMock = vi.fn().mockResolvedValue({ error: null })
    const updateMock = vi.fn().mockReturnValue({
      eq: updateEqMock,
    })
    mocks.from.mockReturnValue({
      select: selectMock,
      update: updateMock,
    })

    const { GET } = await import('@/app/api/auth/callback/route')

    const response = await GET(
      request('/api/auth/callback?code=google-oauth-code&next=%2Ffeed%3Fcareer%3Denfermeiro-a'),
    )

    // Verify it updated user_profiles setting registration_completed: true
    expect(updateMock).toHaveBeenCalledWith({ registration_completed: true })
    expect(updateEqMock).toHaveBeenCalledWith('id', '00000000-0000-0000-0000-0000000000a4')

    // Redirects directly to feed
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'http://localhost/feed?career=enfermeiro-a',
    )
  })
})
