import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser, isSubscriber } from '@/lib/auth/roles'
import { getLaunchCareerSlug } from '@/lib/db/launch-career'
import { AprovaenfLogo } from '@/features/brand/aprovaenf-logo'
import { Paywall } from '@/features/billing/paywall'

export const dynamic = 'force-dynamic'

// Paywall screen for signed-in students without an active plan. Reaching the
// feed requires a subscription, so this is where non-subscribers are sent.
export default async function SubscribePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/assinar')
  if (user.role === 'admin') redirect('/admin')
  if (user.role === 'author') redirect('/author/questions')

  if (!user.registrationCompleted) {
    redirect('/completar-cadastro?next=/assinar')
  }

  if (await isSubscriber()) {
    const slug = await getLaunchCareerSlug()
    redirect(slug ? `/feed?career=${slug}` : '/')
  }

  return (
    <main className="mx-auto min-h-screen max-w-xl px-4 py-8">
      <Link href="/" aria-label="aprovaenf início">
        <AprovaenfLogo className="mb-8 text-[var(--teal)]" />
      </Link>
      <Paywall
        title="Assine para acessar as questões"
        description="Escolha um plano e pratique sem limites: questões comentadas, favoritos e histórico de erros."
      />
    </main>
  )
}
