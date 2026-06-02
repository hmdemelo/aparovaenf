import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/db/database.types'
import { createSupabaseServerClient } from '@/lib/db/server'
import { getCurrentUser } from '@/lib/auth/roles'
import { getAuthorProfileId } from './author-permissions'

type Db = SupabaseClient<Database>

export type AuthorContext =
  | { ok: true; db: Db; userId: string; authorId: string }
  | { ok: false; code: 'unauthenticated' | 'forbidden' }

/**
 * Resolve the authenticated author for author-panel routes. Uses the
 * user-scoped client so all queries run under the author's RLS policies.
 */
export async function resolveAuthorContext(): Promise<AuthorContext> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, code: 'unauthenticated' }
  if (user.role !== 'author' && user.role !== 'admin') {
    return { ok: false, code: 'forbidden' }
  }

  const db = await createSupabaseServerClient()
  const authorId = await getAuthorProfileId(db, user.id)
  if (!authorId) return { ok: false, code: 'forbidden' }

  return { ok: true, db, userId: user.id, authorId }
}
