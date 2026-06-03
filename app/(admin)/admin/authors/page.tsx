import Link from 'next/link'
import { redirect } from 'next/navigation'
import { BarChart3, Layers, Users } from 'lucide-react'
import { AprovaenfLogo } from '@/features/brand/aprovaenf-logo'
import { resolveAdminContext } from '@/features/admin/admin-permissions'
import { listAuthors } from '@/features/admin/admin-service'
import { AdminAuthorsManager } from '@/features/admin/admin-authors-manager'
import { LogoutButton } from '@/components/logout-button'

export const dynamic = 'force-dynamic'

export default async function AdminAuthorsPage() {
  const ctx = await resolveAdminContext()
  if (!ctx.ok) redirect('/login?next=/admin/authors')

  const authors = await listAuthors(ctx.db)

  return (
    <main className="aprova-frame-main min-h-screen px-4 py-6 sm:py-8">
      <div className="aprova-admin-shell mx-auto flex w-full max-w-[980px] max-md:flex-col">
        <aside className="aprova-sidebar flex w-[200px] shrink-0 flex-col border-r px-[14px] py-5 max-md:w-full max-md:border-r-0 max-md:border-b">
          <AprovaenfLogo
            className="mb-6 text-[var(--teal)] max-md:mb-3"
            textClassName="text-[21px]"
          />

          <nav className="flex flex-col gap-0.5 max-md:flex-row max-md:flex-wrap">
            <Link href="/admin" className="aprova-nav-item">
              <BarChart3 size={18} />
              Painel
            </Link>
            <Link
              href="/admin/authors"
              className="aprova-nav-item aprova-nav-item-active"
            >
              <Users size={18} />
              Autores
            </Link>
            <Link href="/admin/subjects" className="aprova-nav-item">
              <Layers size={18} />
              Assuntos
            </Link>
          </nav>

          <div className="mt-auto pt-5 max-md:mt-3 max-md:pt-0">
            <LogoutButton />
          </div>
        </aside>

        <section className="aprova-content-panel min-w-0 flex-1 bg-white px-5 py-6 sm:px-[30px]">
          <AdminAuthorsManager authors={authors} />
        </section>
      </div>
    </main>
  )
}
