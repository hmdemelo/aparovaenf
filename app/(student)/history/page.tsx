import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CheckCircle2, XCircle } from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/db/server'
import { getCurrentUser, isSubscriber } from '@/lib/auth/roles'
import { AprovaenfLogo } from '@/features/brand/aprovaenf-logo'
import { listAnswerHistory } from '@/features/account/answer-history-service'

export const dynamic = 'force-dynamic'

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

// Answered-questions history requires an active subscription (navigation spec).
export default async function HistoryPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/history')
  // Blocked for students without an active plan (navigation spec).
  if (!(await isSubscriber())) redirect('/assinar')

  const db = await createSupabaseServerClient()
  const history = await listAnswerHistory(db, user.id)

  return (
    <main className="mx-auto min-h-screen max-w-xl px-4 py-8">
      <Link href="/" aria-label="aprovaenf início">
        <AprovaenfLogo className="mb-8 text-[var(--teal)]" />
      </Link>
      <h1 className="font-display mb-6 text-[28px] font-semibold text-[var(--ink)]">
        Histórico de questões
      </h1>

      {history.length === 0 ? (
        <p className="rounded-[18px] border border-dashed border-[color:var(--line-2)] p-8 text-center text-[var(--muted)]">
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
                  className="flex items-start gap-3 rounded-[18px] border border-[color:var(--line)] bg-white/82 p-4 transition hover:border-[rgba(0,84,64,0.28)]"
                >
                  {item.isCorrect ? (
                    <CheckCircle2
                      size={20}
                      className="mt-0.5 shrink-0 text-[var(--teal)]"
                      aria-label="Resposta correta"
                    />
                  ) : (
                    <XCircle
                      size={20}
                      className="mt-0.5 shrink-0 text-[var(--danger)]"
                      aria-label="Resposta incorreta"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm text-[var(--ink)]">
                      {item.statement}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
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
        className="mt-6 inline-block text-sm font-semibold text-[var(--teal)] underline"
      >
        ← Voltar ao início
      </Link>
    </main>
  )
}
