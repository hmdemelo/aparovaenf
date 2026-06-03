import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/db/database.types'
import type { ServerEnv } from '@/lib/env/server'
import { PLANS, type PlanId } from './plans'
import Stripe from 'stripe'

type Db = SupabaseClient<Database>
const PROVIDER = 'stripe'

const ACTIVATION_EVENTS = new Set([
  'checkout.session.completed',
  'invoice.paid',
])

type CheckoutUser = {
  id: string
  email: string | null
}

type CreateCheckoutInput = {
  env: Pick<
    ServerEnv,
    | 'STRIPE_SECRET_KEY'
    | 'NEXT_PUBLIC_APP_URL'
    | 'STRIPE_MONTHLY_PRICE_ID'
    | 'STRIPE_ANNUAL_PRICE_ID'
  >
  planId: PlanId
  subscriptionId: string
  user: CheckoutUser
}

export type ProviderCheckout = {
  checkoutId: string
  checkoutUrl: string
  amountCents: number
  status: string | null
}

export type PendingSubscriptionInput = {
  id: string
  userId: string
  plan: PlanId
}

export type SubscriptionActivationResult =
  | {
      ok: true
      activated: true
      subscriptionId: string
      userId: string
      plan: PlanId
    }
  | { ok: true; activated: false }
  | { ok: false; error: string }

export async function createPendingSubscription(
  db: Db,
  input: PendingSubscriptionInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await db.from('subscriptions').insert({
    id: input.id,
    user_id: input.userId,
    plan: input.plan,
    status: 'pending',
    provider: PROVIDER,
  })

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function createStripeCheckout(
  input: CreateCheckoutInput,
): Promise<ProviderCheckout> {
  const isDummyKey = input.env.STRIPE_SECRET_KEY?.startsWith('stripe_dev_')
  const mockUrl = `${withoutTrailingSlash(input.env.NEXT_PUBLIC_APP_URL)}/?checkout=mock&provider=stripe&subscription_id=${input.subscriptionId}&plan=${input.planId}&user_id=${input.user.id}`

  if (isDummyKey) {
    console.warn('[billing.checkout] Using fallback local mock checkout (detected stripe_dev_* API key)')
    return {
      checkoutId: 'checkout_mock_' + input.subscriptionId,
      checkoutUrl: mockUrl,
      amountCents: PLANS[input.planId].amountCents,
      status: 'pending',
    }
  }

  const appUrl = withoutTrailingSlash(input.env.NEXT_PUBLIC_APP_URL)
  const priceId = getStripePriceId(input.planId, input.env)

  try {
    const stripe = new Stripe(input.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20' as any,
    })

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'pix'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      customer_email: input.user.email ?? undefined,
      client_reference_id: input.subscriptionId,
      metadata: {
        user_id: input.user.id,
        subscription_id: input.subscriptionId,
        plan: input.planId,
      },
      success_url: `${appUrl}/feed?subscription=success`,
      cancel_url: `${appUrl}/assinar`,
    })

    if (!session.url) {
      throw new Error('Stripe Checkout Session URL was not generated')
    }

    return {
      checkoutId: session.id,
      checkoutUrl: session.url,
      amountCents: PLANS[input.planId].amountCents,
      status: session.status,
    }
  } catch (error) {
    console.error('[billing.checkout] Stripe API error, falling back to mock checkout:', error)
    const isLocalDev = appUrl.includes('localhost')
    if (isLocalDev) {
      return {
        checkoutId: 'checkout_mock_' + input.subscriptionId,
        checkoutUrl: mockUrl,
        amountCents: PLANS[input.planId].amountCents,
        status: 'pending',
      }
    }
    throw error
  }
}

export async function cancelSubscriptionFromWebhook(
  db: Db,
  providerSubscriptionId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await db
    .from('subscriptions')
    .update({ status: 'expired' })
    .eq('provider_subscription_id', providerSubscriptionId)
    .eq('status', 'active')

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function activateSubscriptionFromWebhook(
  db: Db,
  payload: unknown,
): Promise<SubscriptionActivationResult> {
  const activation = extractSubscriptionActivation(payload)
  if (!activation.ok) return activation
  if (!activation.activated) return { ok: true, activated: false }

  const existing = activation.localSubscriptionId
    ? await findLocalSubscription(db, activation.localSubscriptionId)
    : { ok: true as const, row: null }
  if (!existing.ok) return { ok: false, error: existing.error }

  const userId = activation.userId ?? existing.row?.user_id
  if (!userId) return { ok: false, error: 'missing subscription reference' }

  const subscriptionId = activation.localSubscriptionId ?? crypto.randomUUID()
  const expired = await expireOtherActiveSubscriptions(db, userId, subscriptionId)
  if (!expired.ok) return expired

  const row = {
    user_id: userId,
    plan: activation.plan,
    status: 'active' as const,
    provider: PROVIDER,
    provider_customer_id: activation.providerCustomerId,
    provider_subscription_id: activation.providerSubscriptionId,
    current_period_start: activation.periodStart,
    current_period_end: activation.periodEnd,
  }

  if (existing.row) {
    const { error } = await db
      .from('subscriptions')
      .update(row)
      .eq('id', existing.row.id)
    if (error) return { ok: false, error: error.message }
    return {
      ok: true,
      activated: true,
      subscriptionId: existing.row.id,
      userId,
      plan: activation.plan,
    }
  }

  const { error } = await db.from('subscriptions').insert({
    id: subscriptionId,
    ...row,
  })
  if (error) return { ok: false, error: error.message }

  return {
    ok: true,
    activated: true,
    subscriptionId,
    userId,
    plan: activation.plan,
  }
}

function getStripePriceId(
  planId: PlanId,
  env: Pick<
    ServerEnv,
    'STRIPE_MONTHLY_PRICE_ID' | 'STRIPE_ANNUAL_PRICE_ID'
  >,
): string {
  const value =
    planId === 'monthly'
      ? env.STRIPE_MONTHLY_PRICE_ID
      : env.STRIPE_ANNUAL_PRICE_ID
  return value?.trim() || `stripe-price-${planId}`
}

function withoutTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {}
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    const stringValue = asString(value)
    if (stringValue) return stringValue
  }
  return null
}

function planFromValue(value: unknown): PlanId | null {
  if (value === 'monthly' || value === 'MONTHLY') return 'monthly'
  if (value === 'annual' || value === 'ANNUAL' || value === 'ANNUALLY') {
    return 'annual'
  }
  return null
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date.getTime())
  next.setMonth(next.getMonth() + months)
  return next
}

function addYears(date: Date, years: number): Date {
  const next = new Date(date.getTime())
  next.setFullYear(next.getFullYear() + years)
  return next
}

function periodForPlan(plan: PlanId, paidAt: Date) {
  const start = new Date(paidAt.getTime())
  const end = plan === 'monthly' ? addMonths(start, 1) : addYears(start, 1)
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  }
}

function extractSubscriptionActivation(payload: unknown):
  | {
      ok: true
      activated: true
      localSubscriptionId: string | null
      userId: string | null
      plan: PlanId
      providerCustomerId: string | null
      providerSubscriptionId: string | null
      periodStart: string
      periodEnd: string
    }
  | { ok: true; activated: false }
  | { ok: false; error: string } {
  const root = asRecord(payload)
  const eventType = asString(root.type)
  if (!eventType || !ACTIVATION_EVENTS.has(eventType)) {
    return { ok: true, activated: false }
  }

  const data = asRecord(root.data)
  const obj = asRecord(data.object)
  const metadata = asRecord(obj.metadata)

  const localSubscriptionId = firstString(
    metadata.subscription_id,
    metadata.subscriptionId,
    obj.client_reference_id,
  )
  const userId = firstString(
    metadata.user_id,
    metadata.userId,
  )

  const plan = planFromValue(metadata.plan)
  if (!plan) return { ok: false, error: 'missing subscription plan in metadata' }

  // Handle current period timestamps if present (Stripe provides seconds)
  const periodStartSec = asNumber(obj.current_period_start)
  const periodEndSec = asNumber(obj.current_period_end)

  let periodStart: string
  let periodEnd: string

  if (periodStartSec) {
    const start = new Date(periodStartSec * 1000)
    periodStart = start.toISOString()
    periodEnd = periodEndSec
      ? new Date(periodEndSec * 1000).toISOString()
      : periodForPlan(plan, start).end
  } else {
    const now = new Date()
    periodStart = now.toISOString()
    periodEnd = periodForPlan(plan, now).end
  }

  return {
    ok: true,
    activated: true,
    localSubscriptionId,
    userId,
    plan,
    providerCustomerId: firstString(obj.customer),
    providerSubscriptionId: firstString(obj.subscription, obj.id),
    periodStart,
    periodEnd,
  }
}

async function findLocalSubscription(db: Db, id: string) {
  const { data, error } = await db
    .from('subscriptions')
    .select('id, user_id')
    .eq('id', id)
    .maybeSingle()

  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, row: data }
}

async function expireOtherActiveSubscriptions(
  db: Db,
  userId: string,
  subscriptionId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await db
    .from('subscriptions')
    .update({ status: 'expired' })
    .eq('user_id', userId)
    .eq('status', 'active')
    .neq('id', subscriptionId)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
