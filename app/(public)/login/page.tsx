import { LoginForm } from '@/features/auth/login-form'
import { AprovaenfLogo } from '@/features/brand/aprovaenf-logo'
import { normalizeAuthRedirectPath } from '@/lib/validation/schemas'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ auth_error?: string; next?: string }>
}) {
  const { auth_error, next } = await searchParams
  const target = normalizeAuthRedirectPath(next)

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
      <div className="aprova-paper-card w-full max-w-md p-5 sm:p-7">
        <AprovaenfLogo className="mb-5 justify-center text-[var(--teal)]" />
        <h1 className="font-display mb-1 text-center text-[25px] font-semibold text-[var(--ink)]">
          Entrar na sua conta
        </h1>
        <p className="mb-6 text-center text-sm text-[var(--muted)]">
          Continue sua preparação no aprovaenf.
        </p>
        <LoginForm next={target} authError={auth_error} />
      </div>
    </main>
  )
}
