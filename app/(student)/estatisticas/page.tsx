import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/db/server'
import { getCurrentUser, isSubscriber } from '@/lib/auth/roles'
import {
  getPerformanceStats,
  type PerformanceBucket,
} from '@/features/student-feed/performance-stats-service'

export const dynamic = 'force-dynamic'

function BucketList({
  title,
  buckets,
  testId,
}: {
  title: string
  buckets: PerformanceBucket[]
  testId: string
}) {
  if (buckets.length === 0) return null
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-[20px] font-semibold text-[var(--ink)]">
        {title}
      </h2>
      <ul className="flex flex-col gap-2" data-testid={testId}>
        {buckets.map((b) => (
          <li
            key={b.name}
            className="rounded-[18px] border border-[color:var(--line)] bg-white/82 px-4 py-3"
          >
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold text-[var(--ink)]">{b.name}</span>
              <span className="shrink-0 text-xs font-semibold text-[var(--muted)]">
                {b.correct}/{b.total} · {b.accuracy}%
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface)]">
              <div
                className="h-full rounded-full bg-[var(--teal-mid)]"
                style={{ width: `${b.accuracy}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

// Performance stats are a subscriber-only retention feature (Fase 2.4).
export default async function EstatisticasPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/estatisticas')

  if (!user.registrationCompleted) {
    redirect('/completar-cadastro?next=/estatisticas')
  }

  if (!(await isSubscriber())) redirect('/assinar')

  const db = await createSupabaseServerClient()
  const stats = await getPerformanceStats(db, user.id)

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-6 md:py-10">
      <div>
        <h1 className="font-display mb-6 text-[28px] font-semibold text-[var(--ink)]">
          Estatísticas
        </h1>

        {stats.total === 0 ? (
          <p className="rounded-[18px] border border-dashed border-[color:var(--line-2)] p-8 text-center text-[var(--muted)]">
            Você ainda não respondeu nenhuma questão. Comece a praticar!
          </p>
        ) : (
          <div
            className="grid grid-cols-3 gap-3 text-center"
            data-testid="stats-summary"
          >
            <div className="rounded-[18px] border border-[color:var(--line)] bg-white/82 px-3 py-4">
              <p className="font-display text-[26px] font-semibold text-[var(--ink)]">
                {stats.total}
              </p>
              <p className="text-xs font-semibold text-[var(--muted)]">
                Respondidas
              </p>
            </div>
            <div className="rounded-[18px] border border-[color:var(--line)] bg-white/82 px-3 py-4">
              <p className="font-display text-[26px] font-semibold text-[var(--teal)]">
                {stats.correct}
              </p>
              <p className="text-xs font-semibold text-[var(--muted)]">
                Acertos
              </p>
            </div>
            <div className="rounded-[18px] border border-[color:var(--line)] bg-white/82 px-3 py-4">
              <p className="font-display text-[26px] font-semibold text-[var(--ink)]">
                {stats.accuracy}%
              </p>
              <p className="text-xs font-semibold text-[var(--muted)]">
                Aproveitamento
              </p>
            </div>
          </div>
        )}
      </div>

      <BucketList
        title="Por assunto"
        buckets={stats.bySubject}
        testId="stats-by-subject"
      />
      <BucketList
        title="Por banca"
        buckets={stats.byBoard}
        testId="stats-by-board"
      />
    </main>
  )
}
