import Link from 'next/link'
import { redirect } from 'next/navigation'
import { BarChart3, Layers, Users } from 'lucide-react'
import { AprovaenfLogo } from '@/features/brand/aprovaenf-logo'
import { resolveAdminContext } from '@/features/admin/admin-permissions'
import { listCareers, listSubjects } from '@/features/admin/subject-service'
import { CreateSubjectForm } from '@/features/admin/create-subject-form'
import { LogoutButton } from '@/components/logout-button'

export const dynamic = 'force-dynamic'

export default async function AdminSubjectsPage() {
  const ctx = await resolveAdminContext()
  if (!ctx.ok) redirect('/login?next=/admin/subjects')

  const [careers, subjects] = await Promise.all([
    listCareers(ctx.db),
    listSubjects(ctx.db),
  ])

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
            <Link href="/admin/authors" className="aprova-nav-item">
              <Users size={18} />
              Autores
            </Link>
            <Link
              href="/admin/subjects"
              className="aprova-nav-item aprova-nav-item-active"
            >
              <Layers size={18} />
              Assuntos
            </Link>
          </nav>

          <div className="mt-auto pt-5 max-md:mt-3 max-md:pt-0">
            <LogoutButton />
          </div>
        </aside>

        <section className="aprova-content-panel min-w-0 flex-1 bg-white px-5 py-6 sm:px-[30px]">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.04em] text-[var(--muted)]">
              Administrativo
            </p>
            <h1 className="mt-1 text-[27px] font-semibold leading-tight text-[var(--ink)]">
              Assuntos
            </h1>
          </div>

          <section className="mb-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.04em] text-[var(--muted)]">
              Novo assunto
            </h2>
            <CreateSubjectForm careers={careers} />
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.04em] text-[var(--muted)]">
              {subjects.length} {subjects.length === 1 ? 'assunto' : 'assuntos'}
            </h2>
            <ul className="flex flex-col gap-2" data-testid="admin-subjects">
              {subjects.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-4 rounded-[18px] border border-[color:var(--line)] bg-white/82 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--ink)]">
                      {s.name}
                    </p>
                    <p className="truncate text-xs text-[var(--muted)]">
                      {s.slug}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[var(--teal-light)] px-2 py-1 text-xs text-[var(--teal-ink)]">
                    {s.career ?? 'sem carreira'}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </section>
      </div>
    </main>
  )
}
