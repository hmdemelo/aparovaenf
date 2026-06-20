import { redirect } from 'next/navigation'
import { resolveAuthorContext } from '@/features/authors/author-context'
import { listPoolQuestions } from '@/features/authors/author-question-service'
import { PoolQuestionsList } from '@/features/authors/pool-questions-list'

export const dynamic = 'force-dynamic'

export default async function AuthorPoolPage() {
  const ctx = await resolveAuthorContext()
  if (!ctx.ok) redirect('/login?next=/author/questions/pool')

  const questions = await listPoolQuestions(ctx.db)

  return (
    <>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.04em] text-[var(--muted)]">
          Área do autor
        </p>
        <h1 className="mt-1 text-[27px] font-semibold leading-tight text-[var(--ink)]">
          Banco de Questões (Pool)
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)] max-w-xl">
          Estas são questões carregadas em lote pelo administrador que estão sem atribuição.
          Você pode editá-las diretamente no pool ou reivindicá-las para sua área privada.
          Ao publicar qualquer questão do pool, você se tornará o autor oficial dela.
        </p>
      </div>

      <PoolQuestionsList initialQuestions={questions} />
    </>
  )
}
