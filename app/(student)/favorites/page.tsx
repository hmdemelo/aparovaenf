import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/db/server'
import { getCurrentUser, isSubscriber } from '@/lib/auth/roles'
import { listFavorites } from '@/features/student-feed/favorites-service'

export const dynamic = 'force-dynamic'

export default async function FavoritesPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/favorites')

  if (!user.registrationCompleted) {
    redirect('/completar-cadastro?next=/favorites')
  }

  const subscriber = await isSubscriber()
  const db = await createSupabaseServerClient()
  const favorites = subscriber ? await listFavorites(db, user.id) : []

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6 md:py-10">
      <h1 className="font-display mb-6 text-[28px] font-semibold text-[var(--ink)]">
        Favoritos
      </h1>

      {!subscriber ? (
        <div
          className="aprova-paper-card p-6 text-center"
          data-testid="favorites-locked"
        >
          <p className="text-sm leading-relaxed text-[var(--muted)]">
            Favoritos são um recurso para assinantes. Assine para salvar e
            revisar suas questões.
          </p>
        </div>
      ) : favorites.length === 0 ? (
        <p className="rounded-[18px] border border-dashed border-[color:var(--line-2)] p-8 text-center text-[var(--muted)]">
          Você ainda não favoritou nenhuma questão.
        </p>
      ) : (
        <ul className="flex flex-col gap-2" data-testid="favorites-list">
          {favorites.map((f) => (
            <li
              key={f.questionId}
              className="rounded-[18px] border border-[color:var(--line)] bg-white/82 px-4 py-3"
            >
              {f.subject && (
                <span className="text-xs font-semibold text-[var(--muted)]">
                  {f.subject}
                </span>
              )}
              <p className="line-clamp-2 text-sm text-[var(--ink)]">{f.statement}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
