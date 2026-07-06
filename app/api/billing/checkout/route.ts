import { randomUUID } from 'node:crypto'
import type { NextRequest } from 'next/server'
import { ProductEventNames } from '@/features/analytics/product-events'
import { track } from '@/features/analytics/product-events-server'
import {
  attachProviderCheckoutId,
  createPendingSubscription,
  createAsaasCheckout,
} from '@/features/billing/subscription-service'
import { getCurrentUser } from '@/lib/auth/roles'
import { ok, fail, ErrorCodes } from '@/lib/api/response'
import { createSupabaseServiceClient } from '@/lib/db/server'
import { getServerEnv } from '@/lib/env/server'
import { checkoutInputSchema } from '@/lib/validation/schemas'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Each checkout attempt inserts a pending subscription row, so counting the
// recent ones works as a durable per-user rate limit without extra infra.
const CHECKOUT_MAX_PENDING_PER_WINDOW = 5
const CHECKOUT_RATE_WINDOW_MS = 10 * 60 * 1000

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail(ErrorCodes.VALIDATION, 'Invalid JSON body')
  }

  const parsed = checkoutInputSchema.safeParse(body)
  if (!parsed.success) {
    return fail(ErrorCodes.VALIDATION, 'plan must be monthly or annual')
  }

  const user = await getCurrentUser()
  if (!user) {
    return fail(ErrorCodes.UNAUTHENTICATED, 'Authentication required')
  }
  if (user.forcePasswordChange) {
    return fail(ErrorCodes.FORBIDDEN, 'Password change required')
  }

  const env = getServerEnv()
  const db = createSupabaseServiceClient()

  const windowStart = new Date(
    Date.now() - CHECKOUT_RATE_WINDOW_MS,
  ).toISOString()
  const recent = await db
    .from('subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .gte('created_at', windowStart)
  if (recent.error) {
    // Fail open: a broken counter must not block a paying customer.
    console.error(
      '[billing.checkout] rate limit check failed',
      recent.error.message,
    )
  } else if ((recent.count ?? 0) >= CHECKOUT_MAX_PENDING_PER_WINDOW) {
    return fail(
      ErrorCodes.RATE_LIMITED,
      'Too many checkout attempts, try again in a few minutes',
    )
  }

  const subscriptionId = randomUUID()

  const pending = await createPendingSubscription(db, {
    id: subscriptionId,
    userId: user.id,
    plan: parsed.data.plan,
  })
  if (!pending.ok) {
    console.error('[billing.checkout] pending subscription failed', pending.error)
    return fail(ErrorCodes.INTERNAL, 'Could not initialize checkout')
  }

  let checkout
  try {
    checkout = await createAsaasCheckout({
      env,
      planId: parsed.data.plan,
      subscriptionId,
      user: { id: user.id, email: user.email },
      paymentMethod: parsed.data.payment_method,
    })
  } catch (error) {
    console.error('[billing.checkout] provider checkout failed', error)
    return fail(ErrorCodes.INTERNAL, 'Could not create checkout', { status: 502 })
  }

  await attachProviderCheckoutId(db, subscriptionId, checkout.checkoutId)

  await track({
    event_name: ProductEventNames.CHECKOUT_STARTED,
    user_id: user.id,
    metadata: {
      plan: parsed.data.plan,
      payment_method: parsed.data.payment_method,
      subscription_id: subscriptionId,
      checkout_id: checkout.checkoutId,
      amount_cents: checkout.amountCents,
    },
  })

  return ok(
    {
      checkout_id: checkout.checkoutId,
      checkout_url: checkout.checkoutUrl,
      subscription_id: subscriptionId,
      plan: parsed.data.plan,
      amount_cents: checkout.amountCents,
    },
    { status: 201 },
  )
}
