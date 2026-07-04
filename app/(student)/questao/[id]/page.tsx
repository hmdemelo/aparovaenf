import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getCurrentUser, isSubscriber } from '@/lib/auth/roles'
import { createSupabaseServiceClient } from '@/lib/db/server'
import { uuidSchema } from '@/lib/validation/schemas'
import { getQuestionReview } from '@/features/student-feed/question-review-service'
import { QuestionReviewCard } from '@/features/student-feed/question-review'

export const dynamic = 'force-dynamic'

// Review mode is a subscriber-only retention feature: it reveals the correct
// alternative and every author comment, so the gate must stay server-side.
export default async function QuestionReviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  if (!uuidSchema.safeParse(id).success) notFound()

  const user = await getCurrentUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(`/questao/${id}`)}`)

  if (!user.registrationCompleted) {
    redirect(`/completar-cadastro?next=${encodeURIComponent(`/questao/${id}`)}`)
  }

  if (!(await isSubscriber())) redirect('/assinar')

  const svc = createSupabaseServiceClient()
  const review = await getQuestionReview(svc, user.id, id)
  if (!review) notFound()

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6 md:py-10">
      <Link
        href="/history"
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--muted)] transition hover:text-[var(--teal)]"
      >
        <ArrowLeft size={16} />
        Voltar
      </Link>
      <QuestionReviewCard review={review} />
    </main>
  )
}
