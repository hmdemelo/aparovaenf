import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/db/database.types'

type Db = SupabaseClient<Database>

/**
 * Persistent trial consumption, keyed by e-mail.
 *
 * `answer_attempts` cascades away with the auth user, so counting attempts alone
 * lets anyone reset their 3 free questions by deleting and recreating the
 * account. The `trial_consumption` table has no foreign key to auth.users, so a
 * spent trial survives deletion (migration 022).
 *
 * Reads and writes go through the SERVICE-ROLE client only — trial gating is
 * never trusted from the client, and the table grants nothing to anon or
 * authenticated.
 */

/** Lowercased, trimmed e-mail; null when there is nothing usable to key on. */
export function normalizeTrialEmail(email: string | null | undefined): string | null {
  if (typeof email !== 'string') return null
  const normalized = email.trim().toLowerCase()
  return normalized === '' ? null : normalized
}

/** Trial questions this e-mail has already spent, across every account it had. */
export async function getTrialConsumption(
  db: Db,
  email: string | null | undefined,
): Promise<number> {
  const key = normalizeTrialEmail(email)
  if (!key) return 0

  const { data } = await db
    .from('trial_consumption')
    .select('answered_count')
    .eq('email', key)
    .maybeSingle()

  return data?.answered_count ?? 0
}

/**
 * Record the trial spend for an e-mail. Monotonic on the database side, so a
 * recreated account answering from zero can never lower the stored count.
 */
export async function recordTrialConsumption(
  db: Db,
  email: string | null | undefined,
  answeredCount: number,
): Promise<void> {
  const key = normalizeTrialEmail(email)
  if (!key) return

  await db.rpc('record_trial_consumption', {
    p_email: key,
    p_answered_count: answeredCount,
  })
}
