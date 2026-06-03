import { redirect } from 'next/navigation'
import { Users } from 'lucide-react'
import { resolveAdminContext } from '@/features/admin/admin-permissions'
import { listUsers } from '@/features/admin/admin-service'

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

      <section>
        <div className="mb-4 flex items-center gap-2">
          <Users size={18} className="text-[var(--teal)]" />
          <h2 className="text-[21px] font-semibold text-[var(--ink)]">
            Usuários Cadastrados
          </h2>
        </div>
        
        <div className="overflow-x-auto" data-testid="admin-users">
          <table className="aprova-table">
            <thead>
              <tr>
                <th>E-mail</th>
                <th>Perfil</th>
                <th>Assinatura</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="min-w-52 text-[var(--ink)]">{u.email}</td>
                  <td>
                    <span className="rounded-full bg-[#f1efe9] px-2.5 py-1 text-[11px] font-medium text-[var(--muted)]">
                      {u.role}
                    </span>
                  </td>
                  <td className="text-[var(--muted)]">
                    {u.subscriptionStatus ? (
                      <span className="rounded-full bg-[var(--teal-light)] px-2.5 py-1 text-[11px] font-medium text-[var(--teal-ink)]">
                        {u.subscriptionPlan} · {u.subscriptionStatus}
                      </span>
                    ) : (
                      'Sem assinatura'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
