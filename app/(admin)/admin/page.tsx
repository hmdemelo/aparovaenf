import Link from 'next/link'
import { redirect } from 'next/navigation'
import { BarChart3, BookOpen, Layers, PenTool, Users } from 'lucide-react'
import { AprovaenfLogo } from '@/features/brand/aprovaenf-logo'
import { resolveAdminContext } from '@/features/admin/admin-permissions'
import { getAdminMetrics } from '@/features/admin/admin-metrics-service'
import { listUsers, listAllQuestions } from '@/features/admin/admin-service'
import { UnpublishButton } from '@/features/admin/unpublish-button'
import { LogoutButton } from '@/components/logout-button'

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, string> = {
  draft: 'Rascunho',
  published: 'Publicada',
  unpublished: 'Despublicada',
  archived: 'Arquivada',
}

const FUNNEL_LABEL: Record<string, string> = {
  landing_viewed: 'Landing',
  career_selected: 'Carreira escolhida',
  question_answered: 'Questões respondidas',
  signup_required_shown: 'Gate de cadastro',
  signup_completed: 'Cadastros',
  trial_finished: 'Trials finalizados',
  checkout_started: 'Checkouts iniciados',
  subscription_activated: 'Assinaturas ativadas',
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="aprova-metric-card">
      <p className="aprova-metric-number">{value}</p>
      <p className="aprova-metric-label">{label}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const published = status === 'published'

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
        published
          ? 'bg-[var(--teal-light)] text-[var(--teal-ink)]'
          : 'bg-[var(--warn-bg)] text-[var(--warn)]'
      }`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}

export default async function AdminDashboardPage() {
  const ctx = await resolveAdminContext()
  if (!ctx.ok) redirect('/login?next=/admin')

  const [metrics, users, questions] = await Promise.all([
    getAdminMetrics(ctx.db),
    listUsers(ctx.db),
    listAllQuestions(ctx.db),
  ])

  return (
    <main className="min-h-screen px-4 py-6 sm:py-8">
      <div className="aprova-admin-shell mx-auto flex w-full max-w-[980px] max-md:flex-col">
        <aside className="aprova-sidebar flex w-[200px] shrink-0 flex-col border-r px-[14px] py-5 max-md:w-full max-md:border-r-0 max-md:border-b">
          <AprovaenfLogo
            className="mb-6 text-[var(--teal)] max-md:mb-3"
            textClassName="text-[21px]"
          />

          <nav className="flex flex-col gap-0.5 max-md:flex-row max-md:flex-wrap">
            <Link
              href="/admin"
              className="aprova-nav-item aprova-nav-item-active"
            >
              <BarChart3 size={18} />
              Painel
            </Link>
            <Link href="/admin/authors" className="aprova-nav-item">
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

        <section className="min-w-0 flex-1 bg-white px-5 py-6 sm:px-[30px]">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.04em] text-[var(--muted)]">
                Administrativo
              </p>
              <h1 className="mt-1 text-[27px] font-semibold leading-tight text-[var(--ink)]">
                Painel administrativo
              </h1>
            </div>
            <Link
              href="/admin/authors"
              className="aprova-button text-sm"
            >
              <PenTool size={17} />
              Gerenciar autores
            </Link>
          </div>

          <section className="mb-8">
            <h2 className="text-[21px] font-semibold text-[var(--ink)]">
              Visão geral
            </h2>
            <div className="mt-[18px] grid grid-cols-2 gap-[14px] lg:grid-cols-4">
              <Metric label="Usuários" value={metrics.users.total} />
              <Metric label="Autores" value={metrics.users.authors} />
              <Metric
                label="Assinaturas ativas"
                value={metrics.subscriptions.active}
              />
              <Metric
                label="Questões publicadas"
                value={metrics.questions.published}
              />
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-[21px] font-semibold text-[var(--ink)]">Funil</h2>
            <div className="mt-[18px] grid grid-cols-2 gap-[14px] lg:grid-cols-4">
              {Object.entries(metrics.funnel).map(([name, value]) => (
                <Metric key={name} label={FUNNEL_LABEL[name] ?? name} value={value} />
              ))}
            </div>
          </section>

          <section className="mb-8">
            <div className="mb-2 flex items-center gap-2">
              <Users size={18} className="text-[var(--teal)]" />
              <h2 className="text-[21px] font-semibold text-[var(--ink)]">
                Usuários
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

          <section>
            <div className="mb-2 flex items-center gap-2">
              <BookOpen size={18} className="text-[var(--teal)]" />
              <h2 className="text-[21px] font-semibold text-[var(--ink)]">
                Questões
              </h2>
            </div>
            <div className="overflow-x-auto" data-testid="admin-questions">
              <table className="aprova-table">
                <thead>
                  <tr>
                    <th>Enunciado</th>
                    <th>Autor</th>
                    <th>Assunto</th>
                    <th>Status</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q) => (
                    <tr key={q.id}>
                      <td className="min-w-72 max-w-[360px]">
                        <p className="line-clamp-1 text-[var(--ink)]">
                          {q.statement}
                        </p>
                      </td>
                      <td className="text-[var(--muted)]">
                        {q.author ?? 'sem autor'}
                      </td>
                      <td className="text-[var(--muted)]">
                        {q.subject ?? 'sem assunto'}
                      </td>
                      <td>
                        <StatusBadge status={q.status} />
                      </td>
                      <td>
                        {q.status === 'published' && (
                          <UnpublishButton questionId={q.id} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      </div>
    </main>
  )
}
