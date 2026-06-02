import Link from 'next/link'
import { redirect } from 'next/navigation'
import { resolveAdminContext } from '@/features/admin/admin-permissions'
import { getAdminMetrics } from '@/features/admin/admin-metrics-service'
import { listUsers, listAllQuestions } from '@/features/admin/admin-service'
import { UnpublishButton } from '@/features/admin/unpublish-button'

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
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
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
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Painel administrativo</h1>
        <Link
          href="/admin/authors"
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          Gerenciar autores
        </Link>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
          Visão geral
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Usuários" value={metrics.users.total} />
          <Metric label="Autores" value={metrics.users.authors} />
          <Metric label="Assinaturas ativas" value={metrics.subscriptions.active} />
          <Metric label="Questões publicadas" value={metrics.questions.published} />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
          Funil
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Object.entries(metrics.funnel).map(([name, value]) => (
            <Metric key={name} label={FUNNEL_LABEL[name] ?? name} value={value} />
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
          Usuários
        </h2>
        <ul className="flex flex-col gap-1" data-testid="admin-users">
          {users.map((u) => (
            <li
              key={u.id}
              className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2 text-sm"
            >
              <span className="text-slate-700">{u.email}</span>
              <span className="flex items-center gap-2 text-xs">
                <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">
                  {u.role}
                </span>
                {u.subscriptionStatus && (
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">
                    {u.subscriptionPlan} · {u.subscriptionStatus}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
          Questões
        </h2>
        <ul className="flex flex-col gap-2" data-testid="admin-questions">
          {questions.map((q) => (
            <li
              key={q.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3"
            >
              <div className="min-w-0">
                <p className="line-clamp-1 text-sm text-slate-700">{q.statement}</p>
                <p className="text-xs text-slate-600">
                  {q.author ?? 'sem autor'} · {q.subject ?? 'sem assunto'}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    q.status === 'published'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {STATUS_LABEL[q.status] ?? q.status}
                </span>
                {q.status === 'published' && <UnpublishButton questionId={q.id} />}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
