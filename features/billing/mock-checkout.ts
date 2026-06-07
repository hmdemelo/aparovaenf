import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/db/database.types'
import type { ServerEnv } from '@/lib/env/server'
import { activateSubscriptionFromWebhook } from './subscription-service'
import { isStripeMockMode } from './stripe-config'

type Db = SupabaseClient<Database>

export async function confirmStripeMockCheckout(
  db: Db,
  input: {
    env: Pick<ServerEnv, 'NODE_ENV' | 'STRIPE_SECRET_KEY'>
    subscriptionId: string
    authenticatedUserId: string
  },
) {
  if (!isStripeMockMode(input.env)) {
    return { ok: false as const, error: 'mock checkout is disabled' }
  }

  const { data: subscription, error } = await db
    .from('subscriptions')
    .select('id, user_id, plan')
    .eq('id', input.subscriptionId)
    .eq('user_id', input.authenticatedUserId)
    .eq('provider', 'stripe')
    .eq('status', 'pending')
    .maybeSingle()

  if (error) return { ok: false as const, error: error.message }
  if (!subscription) {
    return { ok: false as const, error: 'pending subscription not found' }
  }

  return activateSubscriptionFromWebhook(db, {
    id: `evt_mock_${crypto.randomUUID()}`,
    type: 'checkout.session.completed',
    data: {
      object: {
        id: `cs_mock_${subscription.id}`,
        customer: `cus_mock_${subscription.user_id}`,
        subscription: `sub_mock_${subscription.id}`,
        payment_status: 'paid',
        client_reference_id: subscription.id,
        metadata: {
          user_id: subscription.user_id,
          plan: subscription.plan,
          subscription_id: subscription.id,
        },
      },
    },
  })
}
