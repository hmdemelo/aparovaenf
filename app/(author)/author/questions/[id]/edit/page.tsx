import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { AccountDialog } from '@/features/account/account-dialog'
import { AprovaenfLogo } from '@/features/brand/aprovaenf-logo'
import { loadAccountProfile } from '@/features/account/account-service'
import { resolveAuthorContext } from '@/features/authors/author-context'
import { getAuthorQuestion } from '@/features/authors/author-question-service'
import { loadClassificationOptions } from '@/features/authors/classification-options'
import { QuestionEditor, type EditorInitial } from '@/features/authors/question-editor'
import type { Difficulty } from '@/lib/validation/schemas'

export const dynamic = 'force-dynamic'

export default async function EditQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const ctx = await resolveAuthorContext()
  const { id } = await params
  if (!ctx.ok) redirect(`/login?next=/author/questions/${id}/edit`)

  const question = await getAuthorQuestion(ctx.db, ctx.authorId, id)
  if (!question) notFound()

  const { careers, subjects, boards } = await loadClassificationOptions()
  const account = await loadAccountProfile(ctx.db, ctx.userId)

  const alternatives = [...(question.alternatives ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((a) => ({
      text: a.text,
      is_correct: a.is_correct,
      alternative_comment: a.alternative_comment ?? '',
    }))

  const initial: EditorInitial = {
    id: question.id,
    career_id: question.career_id,
    subject_id: question.subject_id,
    board_id: question.board_id,
    difficulty: question.difficulty as Difficulty,
    statement: question.statement,
    general_comment: question.general_comment,
    alternatives,
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link href="/author/questions" aria-label="Voltar para questões">
          <AprovaenfLogo className="text-[var(--teal)]" />
        </Link>
        <AccountDialog initialProfile={account} />
      </div>
      <div className="mb-5">
        <Link href="/author/questions" className="text-sm font-semibold text-[var(--teal)] underline">
          ← Voltar
        </Link>
        <h1 className="font-display mt-2 text-[28px] font-semibold text-[var(--ink)]">
          Editar questão
        </h1>
      </div>
      <section className="aprova-paper-card p-5 sm:p-6">
        <QuestionEditor
          careers={careers}
          subjects={subjects}
          boards={boards}
          initial={initial}
        />
      </section>
    </main>
  )
}
