import { SignupForm } from '@/features/auth/signup-form'
import { AprovaenfLogo } from '@/features/brand/aprovaenf-logo'

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams
  const target = next && next.startsWith('/') ? next : '/'

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="aprova-paper-card w-full max-w-sm p-6">
        <AprovaenfLogo className="mb-5 justify-center text-[var(--teal)]" />
        <h1 className="font-display mb-1 text-center text-[25px] font-semibold text-[var(--ink)]">
          Criar conta gratuita
        </h1>
        <p className="mb-6 text-center text-sm text-[var(--muted)]">
          Crie sua conta para começar a praticar.
        </p>
        <SignupForm next={target} />
      </div>
    </main>
  )
}
