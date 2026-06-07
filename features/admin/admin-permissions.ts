import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/db/database.types'
import { createSupabaseServerClient } from '@/lib/db/server'
import { getCurrentUser } from '@/lib/auth/roles'

type Db = SupabaseClient<Database>

export type AdminContext =
  | { ok: true; db: Db; userId: string }
  | { ok: false; code: 'unauthenticated' | 'forbidden' }

/**
 * Resolve the authenticated admin for admin-panel routes. Uses the user-scoped
 * client so admin-wide reads/writes run under the `is_admin()` RLS policies.
 */
export async function resolveAdminContext(): Promise<AdminContext> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, code: 'unauthenticated' }
  if (user.forcePasswordChange) return { ok: false, code: 'forbidden' }
  if (user.role !== 'admin') return { ok: false, code: 'forbidden' }
  const db = await createSupabaseServerClient()
  return { ok: true, db, userId: user.id }
}
