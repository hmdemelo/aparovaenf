import Link from 'next/link'
import { redirect } from 'next/navigation'
import { PenLine, Plus } from 'lucide-react'
import { resolveAuthorContext } from '@/features/authors/author-context'
import {
  getAuthorMetrics,
  listAuthorQuestions,
} from '@/features/authors/author-question-service'
import { createSupabaseServiceClient } from '@/lib/db/server'
import { shortQuestionId } from '@/lib/utils/short-question-id'

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
  // Answers received come from other students, which the author's RLS hides;
  // read them with a service client scoped to the authenticated author id.
  const metrics = await getAuthorMetrics(
    createSupabaseServiceClient(),
    ctx.authorId,
  )

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.04em] text-[var(--muted)]">
            Área do autor
          </p>
          <h1 className="mt-1 text-[27px] font-semibold leading-tight text-[var(--ink)]">
            Minhas questões
          </h1>
        </div>
        <Link href="/author/questions/new" className="aprova-button text-sm">
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
                <th>ID</th>
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
                    <td className="whitespace-nowrap font-mono text-xs text-[var(--muted)]">
                      {shortQuestionId(q.id)}
                    </td>
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
    </>
  )
}
