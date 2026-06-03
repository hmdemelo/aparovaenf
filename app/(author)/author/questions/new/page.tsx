import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AccountDialog } from '@/features/account/account-dialog'
import { AprovaenfLogo } from '@/features/brand/aprovaenf-logo'
import { loadAccountProfile } from '@/features/account/account-service'
import { resolveAuthorContext } from '@/features/authors/author-context'
import { loadClassificationOptions } from '@/features/authors/classification-options'
import { QuestionEditor } from '@/features/authors/question-editor'

export const dynamic = 'force-dynamic'

export default async function NewQuestionPage() {
  const ctx = await resolveAuthorContext()
  if (!ctx.ok) redirect('/login?next=/author/questions/new')

  const { careers, subjects, boards } = await loadClassificationOptions()
  const account = await loadAccountProfile(ctx.db, ctx.userId)

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
          Nova questão
        </h1>
      </div>
      <section className="aprova-paper-card p-5 sm:p-6">
        <QuestionEditor careers={careers} subjects={subjects} boards={boards} />
      </section>
    </main>
  )
}
