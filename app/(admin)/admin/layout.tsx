import { redirect } from 'next/navigation'
import { resolveAdminContext } from '@/features/admin/admin-permissions'
import { AdminSidebar } from '@/components/admin-sidebar'
import { getCurrentUser } from '@/lib/auth/roles'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (user && user.forcePasswordChange) {
    redirect('/force-password')
  }

  const ctx = await resolveAdminContext()
  if (!ctx.ok) redirect('/login?next=/admin')

  return (
    <main className="aprova-frame-main min-h-screen px-4 py-6 sm:py-8">
      <div className="aprova-admin-shell mx-auto flex w-full max-w-[980px] max-md:flex-col">
        <AdminSidebar />
        <section className="aprova-content-panel min-w-0 flex-1 bg-white px-5 py-6 sm:px-[30px]">
          {children}
        </section>
      </div>
    </main>
  )
}
