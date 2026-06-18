import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { resolveAuthorContext } from '@/features/authors/author-context'
import { getAuthorQuestion } from '@/features/authors/author-question-service'
import { loadClassificationOptions } from '@/features/authors/classification-options'
import { QuestionEditor, type EditorInitial } from '@/features/authors/question-editor'
import { safeUUID } from '@/lib/utils/uuid'
import { shortQuestionId } from '@/lib/utils/short-question-id'

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

  const alternatives = [...(question.alternatives ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((a) => ({
      id: safeUUID(),
      text: a.text,
      is_correct: a.is_correct,
      alternative_comment: a.alternative_comment ?? '',
    }))

  const initial: EditorInitial = {
    id: question.id,
    career_id: question.career_id,
    subject_id: question.subject_id,
    board_id: question.board_id,
    difficulty: question.difficulty,
    source_type: question.source_type,
    source_orgao: question.source_orgao,
    source_cargo: question.source_cargo,
    source_year: question.source_year,
    source_reference: question.source_reference,
    statement: question.statement,
    general_comment: question.general_comment,
    alternatives,
    tags: question.tags ?? [],
    image_path: question.image_path,
  }

  return (
    <>
      <div className="mb-5">
        <Link href="/author/questions" className="text-sm font-semibold text-[var(--teal)] underline">
          ← Voltar
        </Link>
        <h1 className="font-display mt-2 text-[28px] font-semibold text-[var(--ink)]">
          Editar questão{' '}
          <span className="text-[var(--muted)]">
            · ID{' '}
            <span className="font-mono text-[0.7em] tracking-wide">
              {shortQuestionId(question.id)}
            </span>
          </span>
        </h1>
      </div>
      <QuestionEditor
        careers={careers}
        subjects={subjects}
        boards={boards}
        initial={initial}
      />
    </>
  )
}
