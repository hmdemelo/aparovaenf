import { redirect } from 'next/navigation'
import { resolveAdminContext } from '@/features/admin/admin-permissions'
import { listUsers } from '@/features/admin/admin-service'
import { AdminUsersManager } from '@/features/admin/admin-users-manager'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const ctx = await resolveAdminContext()
  if (!ctx.ok) redirect('/login?next=/admin/users')

  const users = await listUsers(ctx.db)

  return (
    <>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.04em] text-[var(--muted)]">
          Administrativo
        </p>
        <h1 className="mt-1 text-[27px] font-semibold leading-tight text-[var(--ink)]">
          Gestão de Usuários
        </h1>
      </div>

      <AdminUsersManager users={users} />
    </>
  )
}
