import Link from 'next/link'
import { redirect } from 'next/navigation'
import { BarChart3, BookOpen, PenLine, Plus } from 'lucide-react'
import { AccountDialog } from '@/features/account/account-dialog'
import { loadAccountProfile } from '@/features/account/account-service'
import { resolveAuthorContext } from '@/features/authors/author-context'
import {
  getAuthorMetrics,
  listAuthorQuestions,
} from '@/features/authors/author-question-service'
import { createSupabaseServiceClient } from '@/lib/db/server'

export const dynamic = 'force-dynamic'

const percentFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  maximumFractionDigits: 0,
})

const STATUS_LABEL: Record<string, string> = {
  draft: 'Rascunho',
  published: 'Publicada',
  unpublished: 'Despublicada',
  archived: 'Arquivada',
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

export default async function AuthorQuestionsPage() {
  const ctx = await resolveAuthorContext()
  if (!ctx.ok) redirect('/login?next=/author/questions')

  const questions = await listAuthorQuestions(ctx.db, ctx.authorId)
  const account = await loadAccountProfile(ctx.db, ctx.userId)
  // Answers received come from other students, which the author's RLS hides;
  // read them with a service client scoped to the authenticated author id.
  const metrics = await getAuthorMetrics(
    createSupabaseServiceClient(),
    ctx.authorId,
  )

  return (
    <main className="min-h-screen px-4 py-6 sm:py-8">
      <div className="aprova-admin-shell mx-auto flex w-full max-w-[980px] max-md:flex-col">
        <aside className="aprova-sidebar flex w-[200px] shrink-0 flex-col border-r px-[14px] py-5 max-md:w-full max-md:border-r-0 max-md:border-b">
          <p className="aprova-wordmark mb-6 text-[21px] max-md:mb-3">
            aprova<span className="text-[var(--teal)]">enf</span>
          </p>

          <nav className="flex flex-col gap-0.5 max-md:flex-row max-md:flex-wrap">
            <Link
              href="/author/questions"
              className="aprova-nav-item aprova-nav-item-active"
            >
              <BookOpen size={18} />
              Questões
            </Link>
            <Link
              href="/author/questions/new"
              data-testid="new-question"
              className="aprova-nav-item"
            >
              <Plus size={18} />
              Nova questão
            </Link>
            <span className="aprova-nav-item pointer-events-none opacity-70">
              <BarChart3 size={18} />
              Métricas
            </span>
          </nav>

          <div className="mt-auto pt-5 max-md:mt-3 max-md:pt-0">
            <AccountDialog initialProfile={account} />
          </div>
        </aside>

        <section className="min-w-0 flex-1 bg-white px-5 py-6 sm:px-[30px]">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.04em] text-[var(--muted)]">
                Área do autor
              </p>
              <h1 className="mt-1 text-[27px] font-semibold leading-tight text-[var(--ink)]">
                Minhas questões
              </h1>
            </div>
            <Link
              href="/author/questions/new"
              className="aprova-button text-sm"
            >
              <Plus size={17} />
              Nova questão
            </Link>
          </div>

          <section
            className="mb-8 grid grid-cols-1 gap-[14px] sm:grid-cols-3"
            data-testid="author-metrics"
            aria-label="Estatísticas das suas questões"
          >
            <div className="aprova-metric-card">
              <p className="aprova-metric-number">{metrics.totalQuestions}</p>
              <p className="aprova-metric-label">Questões criadas</p>
            </div>
            <div className="aprova-metric-card">
              <p className="aprova-metric-number">{metrics.totalAnswers}</p>
              <p className="aprova-metric-label">Respostas recebidas</p>
            </div>
            <div className="aprova-metric-card bg-[var(--teal-light)]">
              <p className="aprova-metric-number text-[var(--teal)]">
                {percentFormatter.format(metrics.correctRate)}
              </p>
              <p className="aprova-metric-label text-[var(--teal-ink)]">
                Taxa de acerto
              </p>
            </div>
          </section>

          <div className="mb-2 flex items-center gap-2">
            <PenLine size={18} className="text-[var(--teal)]" />
            <h2 className="text-[21px] font-semibold text-[var(--ink)]">
              Banco do autor
            </h2>
          </div>

          {questions.length === 0 ? (
            <p className="rounded-[var(--radius-sm)] border border-dashed border-[color:var(--line-2)] p-8 text-center text-[var(--muted)]">
              Você ainda não criou questões. Comece pela sua primeira!
            </p>
          ) : (
            <div className="overflow-x-auto" data-testid="question-list">
              <table className="aprova-table">
                <thead>
                  <tr>
                    <th>Enunciado</th>
                    <th>Assunto</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q) => {
                    const subject = Array.isArray(q.subject)
                      ? q.subject[0]
                      : q.subject

                    return (
                      <tr key={q.id}>
                        <td className="min-w-72 max-w-[520px]">
                          <Link
                            href={`/author/questions/${q.id}/edit`}
                            className="line-clamp-1 text-[var(--ink)] transition hover:text-[var(--teal)]"
                          >
                            {q.statement}
                          </Link>
                        </td>
                        <td className="text-[var(--muted)]">
                          {subject?.name ?? 'sem assunto'}
                        </td>
                        <td>
                          <StatusBadge status={q.status} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
