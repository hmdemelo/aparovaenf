import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/db/database.types'

type Db = SupabaseClient<Database>
type PaymentEventRow = Database['public']['Tables']['payment_events']['Row']

const PROVIDER = 'asaas'

export type RecordPaymentEventInput = {
  providerEventId: string
  eventType: string
  payload: unknown
}

export type RecordPaymentEventResult =
  | { ok: true; status: 'inserted' | 'duplicate'; event: PaymentEventRow }
  | { ok: false; error: string }

export type PaymentEventRepository = {
  recordReceived(input: RecordPaymentEventInput): Promise<RecordPaymentEventResult>
  markProcessed(providerEventId: string): Promise<{ ok: true } | { ok: false; error: string }>
  markFailed(
    providerEventId: string,
    errorMessage: string,
  ): Promise<{ ok: true } | { ok: false; error: string }>
}

export function createPaymentEventRepository(db: Db): PaymentEventRepository {
  return {
    async recordReceived(input) {
      const { data, error } = await db
        .from('payment_events')
        .insert({
          provider: PROVIDER,
          provider_event_id: input.providerEventId,
          event_type: input.eventType,
          payload: input.payload as Json,
          processing_status: 'received',
        })
        .select('*')
        .single()

      if (!error && data) {
        return { ok: true, status: 'inserted', event: data }
      }

      if (error && isDuplicateError(error)) {
        const existing = await findByProviderEventId(db, input.providerEventId)
        if (!existing.ok) return existing
        return { ok: true, status: 'duplicate', event: existing.event }
      }

      return { ok: false, error: error?.message ?? 'Could not record event' }
    },

    async markProcessed(providerEventId) {
      const { error } = await db
        .from('payment_events')
        .update({
          processing_status: 'processed',
          processed_at: new Date().toISOString(),
          error_message: null,
        })
        .eq('provider', PROVIDER)
        .eq('provider_event_id', providerEventId)

      if (error) return { ok: false, error: error.message }
      return { ok: true }
    },

    async markFailed(providerEventId, errorMessage) {
      const { error } = await db
        .from('payment_events')
        .update({
          processing_status: 'failed',
          error_message: errorMessage.slice(0, 500),
        })
        .eq('provider', PROVIDER)
        .eq('provider_event_id', providerEventId)

      if (error) return { ok: false, error: error.message }
      return { ok: true }
    },
  }
}

async function findByProviderEventId(
  db: Db,
  providerEventId: string,
): Promise<{ ok: true; event: PaymentEventRow } | { ok: false; error: string }> {
  const { data, error } = await db
    .from('payment_events')
    .select('*')
    .eq('provider', PROVIDER)
    .eq('provider_event_id', providerEventId)
    .single()

  if (error) return { ok: false, error: error.message }
  return { ok: true, event: data }
}

function isDuplicateError(error: { code?: string; message?: string }) {
  return (
    error.code === '23505' ||
    error.message?.toLowerCase().includes('duplicate') ||
    error.message?.toLowerCase().includes('unique')
  )
}
