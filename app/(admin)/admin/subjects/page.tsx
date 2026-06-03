import { redirect } from 'next/navigation'
import { resolveAdminContext } from '@/features/admin/admin-permissions'
import { listCareers, listSubjects } from '@/features/admin/subject-service'
import { CreateSubjectForm } from '@/features/admin/create-subject-form'

export const dynamic = 'force-dynamic'

export default async function AdminSubjectsPage() {
  const ctx = await resolveAdminContext()
  if (!ctx.ok) redirect('/login?next=/admin/subjects')

  const [careers, subjects] = await Promise.all([
    listCareers(ctx.db),
    listSubjects(ctx.db),
  ])

  return (
    <>
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
    </>
  )
}
