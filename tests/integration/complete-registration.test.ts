import { describe, expect, it, vi, beforeEach } from 'vitest'
import { isValidElement } from 'react'

const mocks = vi.hoisted(() => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`)
  }),
  getCurrentUser: vi.fn(),
  isSubscriber: vi.fn(),
  getLaunchCareerSlug: vi.fn(),
  cookies: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: mocks.redirect,
}))

vi.mock('next/headers', () => ({
  cookies: mocks.cookies,
}))

vi.mock('@/lib/auth/roles', () => ({
  getCurrentUser: mocks.getCurrentUser,
  isSubscriber: mocks.isSubscriber,
}))

vi.mock('@/lib/db/launch-career', () => ({
  getLaunchCareerSlug: mocks.getLaunchCareerSlug,
}))

describe('/completar-cadastro page guards', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    mocks.cookies.mockResolvedValue({
      get: vi.fn(() => undefined),
    })
    mocks.isSubscriber.mockResolvedValue(false)
    mocks.getLaunchCareerSlug.mockResolvedValue('enfermeiro-a')
  })

  it('redirects unauthenticated visitors to login with a safe return path', async () => {
    mocks.getCurrentUser.mockResolvedValue(null)
    const { default: CompleteRegistrationPage } = await import(
      '@/app/(public)/completar-cadastro/page'
    )

    await expect(() =>
      CompleteRegistrationPage({
        searchParams: Promise.resolve({
          next: '/feed?career=enfermeiro-a',
        }),
      }),
    ).rejects.toThrow(
      'REDIRECT:/login?next=%2Fcompletar-cadastro%3Fnext%3D%252Ffeed%253Fcareer%253Denfermeiro-a',
    )
  })

  it('renders the password completion form for incomplete authenticated users', async () => {
    mocks.getCurrentUser.mockResolvedValue({
      id: '00000000-0000-0000-0000-0000000000a4',
      email: 'aluno@aprovaenf.local',
      role: 'student',
      registrationCompleted: false,
    })
    const { default: CompleteRegistrationPage } = await import(
      '@/app/(public)/completar-cadastro/page'
    )

    const result = await CompleteRegistrationPage({
      searchParams: Promise.resolve({
        next: '/feed?career=enfermeiro-a',
      }),
    })

    expect(isValidElement(result)).toBe(true)
    expect(mocks.redirect).not.toHaveBeenCalled()
  })

  it('redirects completed users to their post-login destination', async () => {
    mocks.getCurrentUser.mockResolvedValue({
      id: '00000000-0000-0000-0000-0000000000a5',
      email: 'assinante@aprovaenf.local',
      role: 'student',
      registrationCompleted: true,
    })
    mocks.isSubscriber.mockResolvedValue(true)
    const { default: CompleteRegistrationPage } = await import(
      '@/app/(public)/completar-cadastro/page'
    )

    await expect(() =>
      CompleteRegistrationPage({
        searchParams: Promise.resolve({
          next: '/feed?career=enfermeiro-a',
        }),
      }),
    ).rejects.toThrow('REDIRECT:/feed?career=enfermeiro-a')
  })
})
