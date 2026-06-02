import Link from 'next/link'
import { redirect } from 'next/navigation'
import { resolveAdminContext } from '@/features/admin/admin-permissions'
import { listAuthors } from '@/features/admin/admin-service'
import { CreateAuthorForm } from '@/features/admin/create-author-form'

export const dynamic = 'force-dynamic'

export default async function AdminAuthorsPage() {
  const ctx = await resolveAdminContext()
  if (!ctx.ok) redirect('/login?next=/admin/authors')

  const authors = await listAuthors(ctx.db)

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Autores</h1>
        <Link href="/admin" className="text-sm text-emerald-700 underline">
          ← Painel
        </Link>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
          Novo autor
        </h2>
        <CreateAuthorForm />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
          {authors.length} {authors.length === 1 ? 'autor' : 'autores'}
        </h2>
        <ul className="flex flex-col gap-2" data-testid="admin-authors">
          {authors.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800">
                  {a.displayName}
                </p>
                <p className="truncate text-xs text-slate-600">
                  {a.email ?? 'sem e-mail'}
                  {a.instagram ? ` · ${a.instagram}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2 text-xs">
                <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">
                  {a.questionCount} publicadas
                </span>
                {!a.isPublic && (
                  <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-700">
                    oculto
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
