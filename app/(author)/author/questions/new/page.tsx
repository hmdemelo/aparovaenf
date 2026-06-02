import Link from 'next/link'
import { redirect } from 'next/navigation'
import { resolveAuthorContext } from '@/features/authors/author-context'
import { loadClassificationOptions } from '@/features/authors/classification-options'
import { QuestionEditor } from '@/features/authors/question-editor'

export const dynamic = 'force-dynamic'

export default async function NewQuestionPage() {
  const ctx = await resolveAuthorContext()
  if (!ctx.ok) redirect('/login?next=/author/questions/new')

  const { careers, subjects, boards } = await loadClassificationOptions()

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-8">
      <Link href="/author/questions" className="text-sm text-emerald-700 underline">
        ← Voltar
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-bold text-slate-900">Nova questão</h1>
      <QuestionEditor careers={careers} subjects={subjects} boards={boards} />
    </main>
  )
}
