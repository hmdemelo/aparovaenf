import Link from 'next/link'
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
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Assuntos</h1>
        <Link href="/admin" className="text-sm text-emerald-700 underline">
          ← Painel
        </Link>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
          Novo assunto
        </h2>
        <CreateSubjectForm careers={careers} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
          {subjects.length} {subjects.length === 1 ? 'assunto' : 'assuntos'}
        </h2>
        <ul className="flex flex-col gap-2" data-testid="admin-subjects">
          {subjects.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800">
                  {s.name}
                </p>
                <p className="truncate text-xs text-slate-600">{s.slug}</p>
              </div>
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                {s.career ?? 'sem carreira'}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
