import { isAsaasMockMode } from '@/features/billing/asaas-config'
import { cancelAsaasSubscription } from '@/features/billing/subscription-service'
import { getCurrentUser } from '@/lib/auth/roles'
import { ok, fail, ErrorCodes } from '@/lib/api/response'
import { createSupabaseServiceClient } from '@/lib/db/server'
import { getServerEnv } from '@/lib/env/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Asaas has no self-service billing portal like Stripe's, so cancellation is
// handled here: stop the card auto-renewal at Asaas and keep access until the
// already-paid period ends. Pix one-time purchases have nothing to cancel —
// they simply expire at current_period_end.
export async function POST() {
  const user = await getCurrentUser()
  if (!user) {
    return fail(ErrorCodes.UNAUTHENTICATED, 'Authentication required')
  }
  if (user.forcePasswordChange) {
    return fail(ErrorCodes.FORBIDDEN, 'Password change required')
  }

  const env = getServerEnv()
  const db = createSupabaseServiceClient()
  const { data, error } = await db
    .from('subscriptions')
    .select('id, provider_subscription_id, current_period_end')
    .eq('user_id', user.id)
    .eq('provider', 'asaas')
    .in('status', ['active', 'past_due'])
    .order('current_period_end', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[billing.cancel] subscription lookup failed', error.message)
    return fail(ErrorCodes.INTERNAL, 'Could not load subscription')
  }
  if (!data) {
    return fail(ErrorCodes.NOT_FOUND, 'No active subscription found')
  }

  // Only real Asaas recurring subscriptions (sub_*) exist remotely; a Pix row
  // holds the checkout id there and needs no remote cancellation.
  const providerSubscriptionId = data.provider_subscription_id
  if (
    providerSubscriptionId?.startsWith('sub_') &&
    !isAsaasMockMode(env)
  ) {
    const canceled = await cancelAsaasSubscription({
      env,
      providerSubscriptionId,
    })
    if (!canceled.ok) {
      console.error('[billing.cancel] provider cancel failed', canceled.error)
      return fail(ErrorCodes.INTERNAL, 'Could not cancel subscription', {
        status: 502,
      })
    }
  }

  return ok({
    canceled: true,
    access_until: data.current_period_end,
  })
}
