import { redirect } from 'next/navigation'
import { resolveAdminContext } from '@/features/admin/admin-permissions'
import { listCareers } from '@/features/admin/subject-service'
import { CatalogManager } from '@/features/admin/catalog-manager'

export const dynamic = 'force-dynamic'

export default async function AdminSubjectsPage() {
  const ctx = await resolveAdminContext()
  if (!ctx.ok) redirect('/login?next=/admin/subjects')

  const careers = await listCareers(ctx.db)

  return (
    <>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.04em] text-[var(--muted)]">
          Administrativo
        </p>
        <h1 className="mt-1 text-[27px] font-semibold leading-tight text-[var(--ink)]">
          Catálogo de Classificações
        </h1>
      </div>

      <CatalogManager careers={careers} />
    </>
  )
}
