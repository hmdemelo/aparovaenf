import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/db/server'
import { getCurrentUser, isSubscriber } from '@/lib/auth/roles'
import { listFavorites } from '@/features/student-feed/favorites-service'

export const dynamic = 'force-dynamic'

export default async function FavoritesPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/favorites')

  const subscriber = await isSubscriber()
  const db = await createSupabaseServerClient()
  const favorites = subscriber ? await listFavorites(db, user.id) : []

  return (
    <main className="mx-auto min-h-screen max-w-xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Favoritos</h1>

      {!subscriber ? (
        <div
          className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center"
          data-testid="favorites-locked"
        >
          <p className="text-sm text-emerald-800">
            Favoritos são um recurso para assinantes. Assine para salvar e
            revisar suas questões.
          </p>
        </div>
      ) : favorites.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
          Você ainda não favoritou nenhuma questão.
        </p>
      ) : (
        <ul className="flex flex-col gap-2" data-testid="favorites-list">
          {favorites.map((f) => (
            <li
              key={f.questionId}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3"
            >
              {f.subject && (
                <span className="text-xs text-slate-400">{f.subject}</span>
              )}
              <p className="line-clamp-2 text-sm text-slate-700">{f.statement}</p>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/"
        className="mt-6 inline-block text-sm text-emerald-700 underline"
      >
        ← Voltar ao início
      </Link>
    </main>
  )
}
