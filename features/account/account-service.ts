import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/db/database.types'
import type { AccountProfileInput } from '@/lib/validation/schemas'

type Db = SupabaseClient<Database>

export type AccountProfile = {
  email: string | null
  name: string
  displayName: string
  shortBio: string
  instagram: string
  /** True when the user has (or had) a non-pending subscription. */
  isPayingOrExPaying: boolean
}

/**
 * A user counts as paying or ex-paying once they have any subscription whose
 * status is not `pending` (active, past_due, canceled, or expired). Used to gate
 * access to the answered-questions history.
 */
export function evaluatePayingOrExPaying(statuses: readonly string[]): boolean {
  return statuses.some((status) => status !== 'pending')
}

/** Whether the user is entitled to the answered-questions history. */
export async function isPayingOrExPaying(
  db: Db,
  userId: string,
): Promise<boolean> {
  const { data } = await db
    .from('subscriptions')
    .select('status')
    .eq('user_id', userId)
  return evaluatePayingOrExPaying((data ?? []).map((s) => s.status))
}

export async function loadAccountProfile(
  db: Db,
  userId: string,
): Promise<AccountProfile> {
  const [{ data: profile }, { data: author }, { data: subscriptions }] =
    await Promise.all([
      db
        .from('user_profiles')
        .select('email, name')
        .eq('id', userId)
        .maybeSingle(),
      db
        .from('author_profiles')
        .select('display_name, short_bio, instagram')
        .eq('user_id', userId)
        .maybeSingle(),
      db.from('subscriptions').select('status').eq('user_id', userId),
    ])

  const fallbackName = profile?.name ?? profile?.email?.split('@')[0] ?? ''

  return {
    email: profile?.email ?? null,
    name: profile?.name ?? fallbackName,
    displayName: author?.display_name ?? fallbackName,
    shortBio: author?.short_bio ?? '',
    instagram: author?.instagram ?? '',
    isPayingOrExPaying: evaluatePayingOrExPaying(
      (subscriptions ?? []).map((s) => s.status),
    ),
  }
}

export type UpdateAccountProfileResult =
  | { ok: true; profile: AccountProfile }
  | { ok: false; error: string }

export async function updateAccountProfile(
  db: Db,
  userId: string,
  input: AccountProfileInput,
): Promise<UpdateAccountProfileResult> {
  const { error: profileError } = await db
    .from('user_profiles')
    .update({ name: input.name })
    .eq('id', userId)
  if (profileError) return { ok: false, error: profileError.message }

  const { error: authorError } = await db
    .from('author_profiles')
    .update({
      display_name: input.display_name,
      short_bio: input.short_bio || null,
      instagram: input.instagram || null,
    })
    .eq('user_id', userId)
  if (authorError) return { ok: false, error: authorError.message }

  return { ok: true, profile: await loadAccountProfile(db, userId) }
}
