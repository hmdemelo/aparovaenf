import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/db/server'
import { getCurrentUser, isSubscriber } from '@/lib/auth/roles'
import { listErrorHistory } from '@/features/student-feed/error-history-service'

export const dynamic = 'force-dynamic'

// Error history is a subscriber-only retention feature (spec FR-011).
export default async function ErrorsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/errors')

  const subscriber = await isSubscriber()

  if (!subscriber) {
    return (
      <main className="mx-auto min-h-screen max-w-xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">Meus erros</h1>
        <div
          className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center"
          data-testid="errors-locked"
        >
          <p className="text-sm text-emerald-800">
            O histórico de erros é um recurso para assinantes. Assine para
            revisar as questões que você errou.
          </p>
        </div>
      </main>
    )
  }

  const db = await createSupabaseServerClient()
  const errors = await listErrorHistory(db, user.id)

  return (
    <main className="mx-auto min-h-screen max-w-xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Meus erros</h1>

      {errors.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
          Você ainda não errou nenhuma questão. Continue praticando!
        </p>
      ) : (
        <ul className="flex flex-col gap-3" data-testid="errors-list">
          {errors.map((e) => (
            <li
              key={e.questionId}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              {e.subject && (
                <span className="text-xs text-slate-600">{e.subject}</span>
              )}
              <p className="text-sm text-slate-800">{e.statement}</p>
              {e.generalComment && (
                <p className="mt-2 border-l-2 border-emerald-200 pl-3 text-xs text-slate-500">
                  {e.generalComment}
                </p>
              )}
            </li>
          ))}
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
