import { createElement } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LoginForm } from '@/features/auth/login-form'
import { SignupForm } from '@/features/auth/signup-form'
import { CompleteRegistrationForm } from '@/features/auth/complete-registration-form'
import { GoogleAuthButton } from '@/components/google-auth-button'

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  signInWithOAuth: vi.fn(),
  signInWithOtp: vi.fn(),
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  updateUser: vi.fn(),
  getUser: vi.fn(),
  updateProfile: vi.fn(),
  updateProfileEq: vi.fn(),
  fetchPostLoginDestination: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mocks.push,
    refresh: mocks.refresh,
  }),
}))

vi.mock('@/lib/db/browser', () => ({
  createSupabaseBrowserClient: () => ({
    auth: {
      signInWithOAuth: mocks.signInWithOAuth,
      signInWithOtp: mocks.signInWithOtp,
      signInWithPassword: mocks.signInWithPassword,
      signUp: mocks.signUp,
      updateUser: mocks.updateUser,
      getUser: mocks.getUser,
    },
    from: () => ({
      update: mocks.updateProfile,
    }),
  }),
}))

vi.mock('@/features/auth/post-login-destination', () => ({
  fetchPostLoginDestination: mocks.fetchPostLoginDestination,
}))

describe('auth forms', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.history.pushState({}, '', '/login')
    mocks.signInWithOAuth.mockResolvedValue({ error: null })
    mocks.signInWithOtp.mockResolvedValue({ error: null })
    mocks.signInWithPassword.mockResolvedValue({ error: null })
    mocks.signUp.mockResolvedValue({ data: { session: {} }, error: null })
    mocks.updateUser.mockResolvedValue({ error: null })
    mocks.getUser.mockResolvedValue({
      data: { user: { id: '00000000-0000-0000-0000-0000000000a4' } },
    })
    mocks.updateProfile.mockReturnValue({ eq: mocks.updateProfileEq })
    mocks.updateProfileEq.mockResolvedValue({ error: null })
    mocks.fetchPostLoginDestination.mockResolvedValue('/feed?career=enfermeiro-a')
  })

  it('starts Google OAuth with the unified callback URL', async () => {
    const user = userEvent.setup()
    render(createElement(GoogleAuthButton, { next: '/feed?career=enfermeiro-a' }))

    await user.click(screen.getByTestId('google-auth'))

    expect(mocks.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=%2Ffeed%3Fcareer%3Denfermeiro-a`,
      },
    })
  })

  it('shows only Google and email/password options on the login form', () => {
    render(createElement(LoginForm, { next: '/feed?career=enfermeiro-a' }))

    expect(screen.getByTestId('google-auth')).toBeInTheDocument()
    expect(screen.getByTestId('email')).toBeInTheDocument()
    expect(screen.getByTestId('password')).toBeInTheDocument()
    expect(screen.getByTestId('submit')).toBeInTheDocument()
    expect(screen.queryByTestId('magic-link-submit')).not.toBeInTheDocument()
    expect(screen.queryByText(/enviar link de acesso/i)).not.toBeInTheDocument()
  })

  it('does not create users from the login form', async () => {
    const user = userEvent.setup()
    render(createElement(LoginForm, { next: '/feed?career=enfermeiro-a' }))

    await user.type(screen.getByTestId('email'), 'aluno@aprovaenf.local')
    await user.type(screen.getByTestId('password'), 'aprovaenf123')
    await user.click(screen.getByTestId('submit'))

    expect(mocks.signInWithPassword).toHaveBeenCalled()
    expect(mocks.signInWithOtp).not.toHaveBeenCalled()
  })

  it('keeps password login available for existing seeded users', async () => {
    const user = userEvent.setup()
    render(createElement(LoginForm, { next: '/feed?career=enfermeiro-a' }))

    await user.type(screen.getByTestId('email'), 'assinante@aprovaenf.local')
    await user.type(screen.getByTestId('password'), 'aprovaenf123')
    await user.click(screen.getByTestId('submit'))

    expect(mocks.signInWithPassword).toHaveBeenCalledWith({
      email: 'assinante@aprovaenf.local',
      password: 'aprovaenf123',
    })
    expect(mocks.push).toHaveBeenCalledWith('/feed?career=enfermeiro-a')
  })

  it('sends signup magic links with profile metadata', async () => {
    const user = userEvent.setup()
    render(createElement(SignupForm, { next: '/feed?career=enfermeiro-a' }))

    await user.type(screen.getByTestId('name'), 'Ana Enfermeira')
    await user.type(screen.getByTestId('email'), 'ana@aprovaenf.local')
    await user.click(screen.getByTestId('magic-link-submit'))

    expect(mocks.signInWithOtp).toHaveBeenCalledWith({
      email: 'ana@aprovaenf.local',
      options: {
        data: { name: 'Ana Enfermeira' },
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=%2Ffeed%3Fcareer%3Denfermeiro-a`,
        shouldCreateUser: true,
      },
    })
  })

  it('validates login e-mails before calling Supabase', async () => {
    const user = userEvent.setup()
    render(createElement(LoginForm, { next: '/' }))

    await user.type(screen.getByTestId('email'), 'email-invalido')
    await user.type(screen.getByTestId('password'), 'aprovaenf123')
    await user.click(screen.getByTestId('submit'))

    await waitFor(() =>
      expect(screen.getByText(/informe um e-mail válido/i)).toBeInTheDocument(),
    )
    expect(mocks.signInWithPassword).not.toHaveBeenCalled()
  })

  it('submits password completion and redirects to the post-login destination', async () => {
    const user = userEvent.setup()
    const sampleValue = 'novasenha123'
    render(
      createElement(CompleteRegistrationForm, {
        next: '/feed?career=enfermeiro-a',
      }),
    )

    await user.type(screen.getByTestId('password'), sampleValue)
    await user.type(screen.getByTestId('confirm-password'), sampleValue)
    await user.click(screen.getByTestId('submit'))

    await waitFor(() =>
      expect(mocks.updateUser).toHaveBeenCalledWith({ password: sampleValue }),
    )
    expect(mocks.updateProfile).toHaveBeenCalledWith({ registration_completed: true })
    expect(mocks.updateProfileEq).toHaveBeenCalledWith(
      'id',
      '00000000-0000-0000-0000-0000000000a4',
    )
    expect(await screen.findByText(/cadastro concluído/i)).toBeInTheDocument()
    expect(mocks.fetchPostLoginDestination).toHaveBeenCalledWith(
      '/feed?career=enfermeiro-a',
    )
    expect(mocks.push).toHaveBeenCalledWith('/feed?career=enfermeiro-a')
    expect(mocks.refresh).toHaveBeenCalled()
  })
})
