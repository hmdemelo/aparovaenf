import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/roles'
import { FeedShell } from '@/features/student-feed/feed-shell'
import { loadFeedFilterOptions } from '@/features/student-feed/feed-filter-options'
import { resolveTrialStatus } from '@/features/trial/trial-server'

export const dynamic = 'force-dynamic'

// /feed?career=<slug>&board=<slug>
// The feed is subscriber-only: visitors are sent to signup, staff to their
// panels, and students without an active plan to the paywall.
export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ career?: string; board?: string }>
}) {
  const { career, board } = await searchParams
  if (!career) redirect('/')

  const next = `/feed?career=${career}${board ? `&board=${board}` : ''}`
  const user = await getCurrentUser()
  if (!user) redirect(`/signup?next=${encodeURIComponent(next)}`)
  if (user.role === 'admin') redirect('/admin')
  if (user.role === 'author') redirect('/author/questions')
  
  if (!user.registrationCompleted) {
    redirect(`/completar-cadastro?next=${encodeURIComponent(next)}`)
  }

  const { status } = await resolveTrialStatus()
  if (!status.canAnswer && !status.subscriptionActive) {
    redirect('/assinar')
  }

  const filterOptions = await loadFeedFilterOptions(career)

  return (
    <FeedShell
      careerSlug={career}
      boardSlug={board}
      filterOptions={filterOptions}
    />
  )
}
