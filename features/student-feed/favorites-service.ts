import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/db/database.types'

type Db = SupabaseClient<Database>

/**
 * Favorites service. Persistence is restricted to active subscribers
 * (constitution: favorites persist only for subscribers). RLS enforces this at
 * the database level; {@link evaluateFavoriteAccess} mirrors the rule so routes
 * can return a clean prompt and record the funnel events.
 */

export type FavoriteAccessContext = {
  isAuthenticated: boolean
  isSubscriber: boolean
}

export type FavoriteAccess =
  | { allowed: true }
  | { allowed: false; reason: 'unauthenticated' | 'subscription_required' }

export function evaluateFavoriteAccess(
  ctx: FavoriteAccessContext,
): FavoriteAccess {
  if (!ctx.isAuthenticated) return { allowed: false, reason: 'unauthenticated' }
  if (!ctx.isSubscriber) {
    return { allowed: false, reason: 'subscription_required' }
  }
  return { allowed: true }
}

export async function addFavorite(
  db: Db,
  userId: string,
  questionId: string,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await db
    .from('favorites')
    .upsert(
      { user_id: userId, question_id: questionId },
      { onConflict: 'user_id,question_id', ignoreDuplicates: true },
    )
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function removeFavorite(
  db: Db,
  userId: string,
  questionId: string,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await db
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('question_id', questionId)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export type FavoriteListItem = {
  questionId: string
  statement: string
  subject: string | null
  favoritedAt: string
}

export async function listFavorites(
  db: Db,
  userId: string,
): Promise<FavoriteListItem[]> {
  const { data } = await db
    .from('favorites')
    .select('created_at, question:questions(id, statement, subject:subjects(name))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return (data ?? [])
    .map((row) => {
      const q = Array.isArray(row.question) ? row.question[0] : row.question
      if (!q) return null
      const subject = Array.isArray(q.subject) ? q.subject[0] : q.subject
      return {
        questionId: q.id,
        statement: q.statement,
        subject: subject?.name ?? null,
        favoritedAt: row.created_at,
      }
    })
    .filter((x): x is FavoriteListItem => x !== null)
}
