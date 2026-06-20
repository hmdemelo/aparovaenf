import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/db/database.types'

type Db = SupabaseClient<Database>

/**
 * Author ownership helpers.
 *
 * RLS already enforces that authors only mutate their own questions, but the
 * service layer checks ownership too so routes can return a clean 403 instead
 * of an opaque empty result.
 */

/** Resolve the author_profiles.id for a given auth user, or null. */
export async function getAuthorProfileId(
  db: Db,
  userId: string,
): Promise<string | null> {
  const { data } = await db
    .from('author_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()
  return data?.id ?? null
}

/** True when the given author profile owns the question (or it is in the public pool). */
export async function authorOwnsQuestion(
  db: Db,
  authorId: string,
  questionId: string,
): Promise<boolean> {
  const { data } = await db
    .from('questions')
    .select('id, author_id')
    .eq('id', questionId)
    .maybeSingle()
  if (!data) return false
  return data.author_id === authorId || data.author_id === null
}
