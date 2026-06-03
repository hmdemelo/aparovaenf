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
    <>
      <div className="mb-5">
        <Link href="/author/questions" className="text-sm font-semibold text-[var(--teal)] underline">
          ← Voltar
        </Link>
        <h1 className="font-display mt-2 text-[28px] font-semibold text-[var(--ink)]">
          Nova questão
        </h1>
      </div>
      <QuestionEditor careers={careers} subjects={subjects} boards={boards} />
    </>
  )
}
