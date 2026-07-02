import { createStripeBillingPortalSession } from '@/features/billing/subscription-service'
import { isStripeMockMode } from '@/features/billing/stripe-config'
import { getCurrentUser } from '@/lib/auth/roles'
import { ok, fail, ErrorCodes } from '@/lib/api/response'
import { createSupabaseServiceClient } from '@/lib/db/server'
import { getServerEnv } from '@/lib/env/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Creates a Stripe Billing Portal session so subscribers can cancel, update
// the card, and see invoices without support intervention.
export async function POST() {
  const user = await getCurrentUser()
  if (!user) {
    return fail(ErrorCodes.UNAUTHENTICATED, 'Authentication required')
  }
  if (user.forcePasswordChange) {
    return fail(ErrorCodes.FORBIDDEN, 'Password change required')
  }

  const env = getServerEnv()
  if (isStripeMockMode(env)) {
    return fail(
      ErrorCodes.NOT_FOUND,
      'Billing portal is not available with the mock checkout',
    )
  }

  const db = createSupabaseServiceClient()
  const { data, error } = await db
    .from('subscriptions')
    .select('provider_customer_id')
    .eq('user_id', user.id)
    .eq('provider', 'stripe')
    .not('provider_customer_id', 'is', null)
    .order('current_period_end', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[billing.portal] subscription lookup failed', error.message)
    return fail(ErrorCodes.INTERNAL, 'Could not load subscription')
  }

  const customerId = data?.provider_customer_id
  if (!customerId) {
    return fail(ErrorCodes.NOT_FOUND, 'No Stripe customer found for this account')
  }

  try {
    const portal = await createStripeBillingPortalSession({ env, customerId })
    return ok({ portal_url: portal.portalUrl })
  } catch (err) {
    console.error('[billing.portal] provider portal session failed', err)
    return fail(ErrorCodes.INTERNAL, 'Could not create billing portal session', {
      status: 502,
    })
  }
}
