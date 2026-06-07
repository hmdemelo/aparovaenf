import { redirect } from 'next/navigation'
import { resolveAdminContext } from '@/features/admin/admin-permissions'
import { listQuestionsPage } from '@/features/admin/admin-service'
import { loadClassificationOptions } from '@/features/authors/classification-options'
import { QuestionModerator } from '@/features/admin/question-moderator'

export const dynamic = 'force-dynamic'

export default async function AdminQuestionsPage() {
  const ctx = await resolveAdminContext()
  if (!ctx.ok) redirect('/login?next=/admin/questions')

  const [initialPage, { subjects, boards }] = await Promise.all([
    listQuestionsPage(ctx.db, { limit: 30 }),
    loadClassificationOptions(),
  ])

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

      <QuestionModerator
        initialQuestions={initialPage.questions}
        initialPagination={initialPage.pagination}
        subjects={subjects}
        boards={boards}
      />
    </>
  )
}
