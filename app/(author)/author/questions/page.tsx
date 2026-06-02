import Link from 'next/link'
import { redirect } from 'next/navigation'
import { resolveAuthorContext } from '@/features/authors/author-context'
import { listAuthorQuestions } from '@/features/authors/author-question-service'

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, string> = {
  draft: 'Rascunho',
  published: 'Publicada',
  unpublished: 'Despublicada',
  archived: 'Arquivada',
}

export default async function AuthorQuestionsPage() {
  const ctx = await resolveAuthorContext()
  if (!ctx.ok) redirect('/login?next=/author/questions')

  const questions = await listAuthorQuestions(ctx.db, ctx.authorId)

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Minhas questões</h1>
        <Link
          href="/author/questions/new"
          data-testid="new-question"
          className="rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"
        >
          Nova questão
        </Link>
      </div>

      {questions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
          Você ainda não criou questões. Comece pela sua primeira!
        </p>
      ) : (
        <ul className="flex flex-col gap-2" data-testid="question-list">
          {questions.map((q) => {
            const subject = Array.isArray(q.subject) ? q.subject[0] : q.subject
            return (
              <li key={q.id}>
                <Link
                  href={`/author/questions/${q.id}/edit`}
                  className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-emerald-300"
                >
                  <span className="line-clamp-1 text-sm text-slate-700">
                    {q.statement}
                  </span>
                  <span className="flex items-center gap-2 whitespace-nowrap text-xs">
                    {subject && (
                      <span className="text-slate-400">{subject.name}</span>
                    )}
                    <span
                      className={`rounded-full px-2 py-1 font-medium ${
                        q.status === 'published'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {STATUS_LABEL[q.status] ?? q.status}
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
