import { cookies } from 'next/headers'
import { CompleteRegistrationForm } from '@/features/auth/complete-registration-form'
import { AprovaenfLogo } from '@/features/brand/aprovaenf-logo'
import { normalizeAuthRedirectPath } from '@/lib/validation/schemas'

export const dynamic = 'force-dynamic'

export default async function CompleteRegistrationPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams
  let target = normalizeAuthRedirectPath(next)

  if (target === '/' || target === '') {
    try {
      const cookieStore = await cookies()
      const selectedCareer = cookieStore.get('selected_career')?.value
      if (selectedCareer) {
        target = `/feed?career=${selectedCareer}`
      }
    } catch {
      // ignore cookies() call outside request context in tests
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
      <div className="aprova-paper-card w-full max-w-md p-5 sm:p-7">
        <AprovaenfLogo className="mb-5 justify-center text-[var(--teal)]" />
        <h1 className="font-display mb-1 text-center text-[25px] font-semibold text-[var(--ink)]">
          Escolha sua senha
        </h1>
        <p className="mb-6 text-center text-sm text-[var(--muted)]">
          Para concluir a criação da sua conta, defina uma senha de acesso.
        </p>
        <CompleteRegistrationForm next={target} />
      </div>
    </main>
  )
}
