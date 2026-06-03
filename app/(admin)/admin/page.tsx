import Link from 'next/link'
import { redirect } from 'next/navigation'
import { PenTool } from 'lucide-react'
import { resolveAdminContext } from '@/features/admin/admin-permissions'
import { getAdminMetrics } from '@/features/admin/admin-metrics-service'

export const dynamic = 'force-dynamic'

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

export default async function AdminDashboardPage() {
  const ctx = await resolveAdminContext()
  if (!ctx.ok) redirect('/login?next=/admin')

  const metrics = await getAdminMetrics(ctx.db)

  return (
    <>
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
    </>
  )
}
