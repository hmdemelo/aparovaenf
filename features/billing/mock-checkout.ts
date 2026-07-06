import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/db/database.types'
import type { ServerEnv } from '@/lib/env/server'
import { activateSubscriptionFromWebhook } from './subscription-service'
import { isAsaasMockMode } from './asaas-config'

type Db = SupabaseClient<Database>

export async function confirmAsaasMockCheckout(
  db: Db,
  input: {
    env: Pick<ServerEnv, 'NODE_ENV' | 'ASAAS_API_KEY'>
    subscriptionId: string
    authenticatedUserId: string
  },
) {
  if (!isAsaasMockMode(input.env)) {
    return { ok: false as const, error: 'mock checkout is disabled' }
  }

  const { data: subscription, error } = await db
    .from('subscriptions')
    .select('id, user_id, plan')
    .eq('id', input.subscriptionId)
    .eq('user_id', input.authenticatedUserId)
    .eq('provider', 'asaas')
    .eq('status', 'pending')
    .maybeSingle()

  if (error) return { ok: false as const, error: error.message }
  if (!subscription) {
    return { ok: false as const, error: 'pending subscription not found' }
  }

  // Mirrors the Asaas payment webhook payload shape.
  return activateSubscriptionFromWebhook(db, {
    id: `evt_mock_${crypto.randomUUID()}`,
    event: 'PAYMENT_CONFIRMED',
    payment: {
      id: `pay_mock_${subscription.id}`,
      customer: `cus_mock_${subscription.user_id}`,
      subscription: `sub_mock_${subscription.id}`,
      billingType: 'CREDIT_CARD',
      externalReference: subscription.id,
    },
  })
}
