'use client'

import { useMemo, useState } from 'react'
import { Search, ShieldAlert, Users } from 'lucide-react'
import type { AdminUserRow } from './admin-service'
import { resolveAdminUserStatus } from './admin-service'
import { ChangePasswordDialog } from './change-password-dialog'
import { DeleteUserDialog } from './delete-user-dialog'

const PAGE_SIZE = 25

function planLabel(plan: string | null) {
  if (plan === 'monthly') return 'Plano mensal'
  if (plan === 'annual') return 'Plano anual'
  return 'Sem plano'
}

export function AdminUsersManager({ users }: { users: AdminUserRow[] }) {
  const [search, setSearch] = useState('')
  const [accessFilter, setAccessFilter] = useState('all')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR')
    return users.filter((user) => {
      const matchesSearch =
        !normalizedSearch ||
        user.name?.toLocaleLowerCase('pt-BR').includes(normalizedSearch) ||
        user.email?.toLocaleLowerCase('pt-BR').includes(normalizedSearch)

      const matchesAccess =
        accessFilter === 'all' ||
        (accessFilter === 'active' &&
          user.subscriptionStatus === 'active') ||
        (accessFilter === 'attention' &&
          ['pending', 'past_due'].includes(user.subscriptionStatus ?? '')) ||
        (accessFilter === 'free' &&
          user.registrationCompleted &&
          !user.subscriptionStatus) ||
        (accessFilter === 'incomplete' && !user.registrationCompleted) ||
        (accessFilter === 'password' && user.forcePasswordChange)

      return matchesSearch && matchesAccess
    })
  }, [accessFilter, search, users])

  const totalPages = Math.max(Math.ceil(filtered.length / PAGE_SIZE), 1)
  const safePage = Math.min(page, totalPages)
  const visibleUsers = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  )

  function updateFilter(value: string) {
    setAccessFilter(value)
    setPage(1)
  }

  return (
    <section className="flex flex-col gap-5">
      <div className="grid gap-3 rounded-[22px] border border-[color:var(--line)] bg-white/82 p-5 shadow-sm md:grid-cols-[1fr_220px]">
        <label className="relative">
          <span className="sr-only">Buscar usuários</span>
          <Search
            aria-hidden="true"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            size={18}
          />
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder="Buscar por nome ou e-mail..."
            className="aprova-field pl-10"
          />
        </label>

        <label>
          <span className="sr-only">Filtrar por acesso</span>
          <select
            aria-label="Filtrar por acesso"
            value={accessFilter}
            onChange={(event) => updateFilter(event.target.value)}
            className="aprova-field"
          >
            <option value="all">Todos os acessos</option>
            <option value="active">Assinaturas ativas</option>
            <option value="attention">Cobranças com atenção</option>
            <option value="free">Cadastros gratuitos</option>
            <option value="incomplete">Cadastros incompletos</option>
            <option value="password">Troca de senha pendente</option>
          </select>
        </label>
      </div>

      <div className="flex items-center gap-2">
        <Users size={18} className="text-[var(--teal)]" />
        <h2 className="text-[21px] font-semibold text-[var(--ink)]">
          {filtered.length} usuários
        </h2>
      </div>

      <div className="overflow-x-auto" data-testid="admin-users">
        <table className="aprova-table">
          <thead>
            <tr>
              <th>Usuário</th>
              <th>Perfil</th>
              <th>Acesso</th>
              <th>Uso</th>
              <th>Plano</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {visibleUsers.map((user) => {
              const status = resolveAdminUserStatus(user)
              return (
                <tr key={user.id}>
                  <td className="min-w-56">
                    <p className="font-medium text-[var(--ink)]">
                      {user.name || 'Nome não informado'}
                    </p>
                    <p className="text-xs text-[var(--muted)]">{user.email}</p>
                  </td>
                  <td>
                    <span className="rounded-full bg-[#f1efe9] px-2.5 py-1 text-[11px] font-medium text-[var(--muted)]">
                      {user.role}
                    </span>
                  </td>
                  <td className="min-w-44">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${status.className}`}
                    >
                      {status.label}
                    </span>
                    {user.forcePasswordChange && (
                      <p className="mt-2 flex items-center gap-1 text-xs font-medium text-amber-700">
                        <ShieldAlert size={13} aria-hidden="true" />
                        Troca de senha pendente
                      </p>
                    )}
                  </td>
                  <td className="text-sm text-[var(--muted)]">
                    {user.answeredCount}{' '}
                    {user.answeredCount === 1 ? 'resposta' : 'respostas'}
                  </td>
                  <td className="min-w-36">
                    <p className="text-sm font-medium text-[var(--ink)]">
                      {planLabel(user.subscriptionPlan)}
                    </p>
                    {user.subscriptionPeriodEnd && (
                      <p className="text-xs text-[var(--muted)]">
                        até{' '}
                        {new Date(user.subscriptionPeriodEnd).toLocaleDateString(
                          'pt-BR',
                        )}
                      </p>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <ChangePasswordDialog
                        userId={user.id}
                        userEmail={user.email ?? ''}
                      />
                      <DeleteUserDialog
                        userId={user.id}
                        userEmail={user.email ?? ''}
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {visibleUsers.length === 0 && (
        <p className="rounded-[18px] border border-dashed border-[color:var(--line)] p-8 text-center text-sm text-[var(--muted)]">
          Nenhum usuário corresponde aos filtros selecionados.
        </p>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={safePage === 1}
            onClick={() => setPage((current) => Math.max(current - 1, 1))}
            className="aprova-button aprova-button-ghost px-4 py-2 text-sm disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-xs font-medium text-[var(--muted)]">
            Página {safePage} de {totalPages}
          </span>
          <button
            type="button"
            disabled={safePage === totalPages}
            onClick={() =>
              setPage((current) => Math.min(current + 1, totalPages))
            }
            className="aprova-button aprova-button-ghost px-4 py-2 text-sm disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
      )}
    </section>
  )
}
