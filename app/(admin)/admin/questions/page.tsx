import { redirect } from 'next/navigation'
import { BookOpen } from 'lucide-react'
import { resolveAdminContext } from '@/features/admin/admin-permissions'
import { listAllQuestions } from '@/features/admin/admin-service'
import { UnpublishButton } from '@/features/admin/unpublish-button'

export const dynamic = 'force-dynamic'

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

export default async function AdminQuestionsPage() {
  const ctx = await resolveAdminContext()
  if (!ctx.ok) redirect('/login?next=/admin/questions')

  const questions = await listAllQuestions(ctx.db)

  return (
    <>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.04em] text-[var(--muted)]">
          Administrativo
        </p>
        <h1 className="mt-1 text-[27px] font-semibold leading-tight text-[var(--ink)]">
          Moderador de Questões
        </h1>
      </div>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <BookOpen size={18} className="text-[var(--teal)]" />
          <h2 className="text-[21px] font-semibold text-[var(--ink)]">
            Questões da Plataforma
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
    </>
  )
}
