/**
 * Product event service.
 *
 * Records the launch funnel events into the internal `product_events` table.
 * Constitution: Observable Operations. Recording must never break a user-facing
 * action, so failures are swallowed and reported, not thrown.
 *
 * Events are written server-side (typically with the service client) so they
 * work for anonymous trial sessions too.
 */

export const ProductEventNames = {
  LANDING_VIEWED: 'landing_viewed',
  CAREER_SELECTED: 'career_selected',
  QUESTION_VIEWED: 'question_viewed',
  QUESTION_ANSWERED: 'question_answered',
  SIGNUP_REQUIRED_SHOWN: 'signup_required_shown',
  SIGNUP_COMPLETED: 'signup_completed',
  TRIAL_FINISHED: 'trial_finished',
  CHECKOUT_STARTED: 'checkout_started',
  SUBSCRIPTION_ACTIVATED: 'subscription_activated',
  FAVORITE_ATTEMPTED: 'favorite_attempted',
  FAVORITE_SAVED: 'favorite_saved',
} as const

export type ProductEventName =
  (typeof ProductEventNames)[keyof typeof ProductEventNames]

export const PRODUCT_EVENT_NAMES: ProductEventName[] =
  Object.values(ProductEventNames)

export type ProductEventInput = {
  event_name: ProductEventName
  user_id?: string | null
  anonymous_session_id?: string | null
  career_id?: string | null
  question_id?: string | null
  metadata?: Record<string, unknown>
}

type ProductEventRow = {
  event_name: ProductEventName
  user_id: string | null
  anonymous_session_id: string | null
  career_id: string | null
  question_id: string | null
  metadata: Record<string, unknown>
}

/**
 * Minimal slice of the Supabase client used here, so the service can be unit
 * tested without a live database.
 */
export interface ProductEventRecorder {
  from(table: string): {
    insert(row: ProductEventRow): Promise<{ error: { message: string } | null }>
  }
}

export type RecordResult = { ok: true } | { ok: false; error: string }

export async function recordProductEvent(
  client: ProductEventRecorder,
  input: ProductEventInput,
): Promise<RecordResult> {
  const row: ProductEventRow = {
    event_name: input.event_name,
    user_id: input.user_id ?? null,
    anonymous_session_id: input.anonymous_session_id ?? null,
    career_id: input.career_id ?? null,
    question_id: input.question_id ?? null,
    metadata: input.metadata ?? {},
  }

  try {
    const { error } = await client.from('product_events').insert(row)
    if (error) {
      return { ok: false, error: error.message }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}
