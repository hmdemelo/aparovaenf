import { redirect } from 'next/navigation'
import { getCurrentUser, isSubscriber } from '@/lib/auth/roles'
import { FeedShell } from '@/features/student-feed/feed-shell'

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
  if (!(await isSubscriber())) redirect('/assinar')

  return <FeedShell careerSlug={career} boardSlug={board} />
}
