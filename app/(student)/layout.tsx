import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getCurrentUser, isSubscriber } from '@/lib/auth/roles'
import { createSupabaseServerClient } from '@/lib/db/server'
import { loadAccountProfile } from '@/features/account/account-service'
import { getLaunchCareerSlug } from '@/lib/db/launch-career'
import { StudentLayout } from '@/components/student-layout'

export const dynamic = 'force-dynamic'

export default async function StudentLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user || !user.registrationCompleted) {
    return <>{children}</>
  }

  if (user.role === 'admin') redirect('/admin')
  if (user.role === 'author') redirect('/author/questions')

  const db = await createSupabaseServerClient()
  const account = await loadAccountProfile(db, user.id)
  const subscriber = await isSubscriber()

  const cookieStore = await cookies()
  let careerSlug = cookieStore.get('selected_career')?.value
  if (!careerSlug) {
    careerSlug = (await getLaunchCareerSlug()) ?? ''
  }

  return (
    <StudentLayout
      account={account}
      careerSlug={careerSlug}
      isSubscriber={subscriber}
    >
      {children}
    </StudentLayout>
  )
}
