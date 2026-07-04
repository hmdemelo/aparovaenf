import Link from 'next/link'
import { redirect } from 'next/navigation'
import { RotateCcw } from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/db/server'
import { getCurrentUser, isSubscriber } from '@/lib/auth/roles'
import { listErrorHistory } from '@/features/student-feed/error-history-service'
import { RichText } from '@/lib/utils/markdown-renderer'
import { shortQuestionId } from '@/lib/utils/short-question-id'

export const dynamic = 'force-dynamic'

// Error history is a subscriber-only retention feature (spec FR-011).
export default async function ErrorsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/errors')

  if (!user.registrationCompleted) {
    redirect('/completar-cadastro?next=/errors')
  }

  // Blocked for students without an active plan (navigation spec).
  if (!(await isSubscriber())) redirect('/assinar')

  const db = await createSupabaseServerClient()
  const errors = await listErrorHistory(db, user.id)

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6 md:py-10">
      <h1 className="font-display mb-6 text-[28px] font-semibold text-[var(--ink)]">
        Meus erros
      </h1>

      {errors.length === 0 ? (
        <p className="rounded-[18px] border border-dashed border-[color:var(--line-2)] p-8 text-center text-[var(--muted)]">
          Você ainda não errou nenhuma questão. Continue praticando!
        </p>
      ) : (
        <ul className="flex flex-col gap-3" data-testid="errors-list">
          {errors.map((e) => (
            <li
              key={e.questionId}
              className="rounded-[18px] border border-[color:var(--line)] bg-white/82 p-4 transition hover:border-[rgba(0,84,64,0.28)]"
            >
              <Link href={`/questao/${e.questionId}`} className="block">
                <div className="flex flex-wrap items-center gap-x-2 text-xs font-semibold text-[var(--muted)]">
                  <span className="font-mono text-[var(--hint)]">
                    ID {shortQuestionId(e.questionId)}
                  </span>
                  {e.subject && <span>· {e.subject}</span>}
                </div>
                <div className="mt-1 text-sm text-[var(--ink)]">
                  <RichText text={e.statement} />
                </div>
                {e.generalComment && (
                  <div className="mt-2 border-l-2 border-[var(--mint-dim)] pl-3 text-xs leading-relaxed text-[var(--muted)]">
                    <RichText text={e.generalComment} />
                  </div>
                )}
              </Link>
              <div className="mt-3 flex items-center gap-4 text-xs font-semibold">
                <Link
                  href={`/questao/${e.questionId}`}
                  className="text-[var(--muted)] underline transition hover:text-[var(--teal)]"
                >
                  Rever questão
                </Link>
                {e.careerSlug && (
                  <Link
                    href={`/feed?career=${e.careerSlug}&question=${e.questionId}`}
                    data-testid="retry-question"
                    className="inline-flex items-center gap-1 text-[var(--teal)] transition hover:text-[var(--teal-mid)]"
                  >
                    <RotateCcw size={14} />
                    Refazer
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
