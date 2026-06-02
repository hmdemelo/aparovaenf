import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CheckCircle2, XCircle } from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/db/server'
import { getCurrentUser } from '@/lib/auth/roles'
import { isPayingOrExPaying } from '@/features/account/account-service'
import { listAnswerHistory } from '@/features/account/answer-history-service'

export const dynamic = 'force-dynamic'

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

// Answered-questions history is for paying or ex-paying students (Ajuste 4).
export default async function HistoryPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/history')

  const db = await createSupabaseServerClient()

  if (!(await isPayingOrExPaying(db, user.id))) {
    return (
      <main className="mx-auto min-h-screen max-w-xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">
          Histórico de questões
        </h1>
        <div
          className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center"
          data-testid="history-locked"
        >
          <p className="text-sm text-emerald-800">
            O histórico de questões respondidas está disponível para assinantes.
            Assine para acompanhar o seu progresso.
          </p>
        </div>
      </main>
    )
  }

  const history = await listAnswerHistory(db, user.id)

  return (
    <main className="mx-auto min-h-screen max-w-xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">
        Histórico de questões
      </h1>

      {history.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
          Você ainda não respondeu nenhuma questão. Comece a praticar!
        </p>
      ) : (
        <ul className="flex flex-col gap-3" data-testid="history-list">
          {history.map((item) => {
            const href = item.careerSlug
              ? `/feed?career=${item.careerSlug}`
              : '/feed'
            return (
              <li key={item.attemptId}>
                <Link
                  href={href}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-emerald-300"
                >
                  {item.isCorrect ? (
                    <CheckCircle2
                      size={20}
                      className="mt-0.5 shrink-0 text-emerald-600"
                      aria-label="Resposta correta"
                    />
                  ) : (
                    <XCircle
                      size={20}
                      className="mt-0.5 shrink-0 text-rose-500"
                      aria-label="Resposta incorreta"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm text-slate-800">
                      {item.statement}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {dateFormatter.format(new Date(item.answeredAt))}
                    </p>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      <Link
        href="/"
        className="mt-6 inline-block text-sm text-emerald-700 underline"
      >
        ← Voltar ao início
      </Link>
    </main>
  )
}
