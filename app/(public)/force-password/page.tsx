import { redirect } from 'next/navigation'
import { ForcePasswordForm } from '@/features/auth/force-password-form'
import { AprovaenfLogo } from '@/features/brand/aprovaenf-logo'
import { getCurrentUser, isSubscriber } from '@/lib/auth/roles'
import { resolvePostLoginPath } from '@/lib/auth/post-login'
import { getLaunchCareerSlug } from '@/lib/db/launch-career'
import { normalizeAuthRedirectPath } from '@/lib/validation/schemas'

export const dynamic = 'force-dynamic'

export default async function ForcePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams
  const target = normalizeAuthRedirectPath(next)

  const user = await getCurrentUser()
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(target)}`)
  }

  // If password change is NOT forced, redirect to app.
  if (!user.forcePasswordChange) {
    let subscriber = false
    let launchCareerSlug: string | null = null
    if (user.role === 'student') {
      subscriber = await isSubscriber()
      if (subscriber) {
        launchCareerSlug = await getLaunchCareerSlug()
      }
    }

    redirect(
      resolvePostLoginPath({
        role: user.role,
        isSubscriber: subscriber,
        launchCareerSlug,
        next: target,
      }),
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
      <div className="aprova-paper-card w-full max-w-md p-5 sm:p-7">
        <AprovaenfLogo className="mb-5 justify-center text-[var(--teal)]" />
        <h1 className="font-display mb-1 text-center text-[25px] font-semibold text-[var(--ink)]">
          Nova senha obrigatória
        </h1>
        <p className="mb-6 text-center text-sm text-[var(--muted)]">
          Sua senha foi redefinida. Escolha uma nova senha definitiva para prosseguir.
        </p>
        <ForcePasswordForm next={target} />
      </div>
    </main>
  )
}
