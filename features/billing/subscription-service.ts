import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/db/database.types'
import type { ServerEnv } from '@/lib/env/server'
import type { PaymentMethod } from '@/lib/validation/schemas'
import { PLANS, type PlanId } from './plans'
import { getAsaasBaseUrl, isAsaasMockMode } from './asaas-config'

type Db = SupabaseClient<Database>
const PROVIDER = 'asaas'

type CheckoutUser = {
  id: string
  email: string | null
  name: string | null
}

type AsaasEnv = Pick<
  ServerEnv,
  'NODE_ENV' | 'ASAAS_API_KEY' | 'NEXT_PUBLIC_APP_URL'
>

type CreateCheckoutInput = {
  env: AsaasEnv
  planId: PlanId
  subscriptionId: string
  user: CheckoutUser
  paymentMethod: PaymentMethod
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
      firstActivation: boolean
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

/**
 * Creates an Asaas hosted Checkout session.
 *
 * Card uses chargeTypes RECURRENT with a subscription cycle (Asaas bills the
 * card automatically each period). Pix has no recurring billing, so it is a
 * DETACHED one-time charge that prepays the plan period; access simply expires
 * at current_period_end. The logged-in user's name/email are sent as
 * customerData to prefill the Asaas-hosted page; remaining fields (CPF,
 * phone) are filled by the payer there.
 */
export async function createAsaasCheckout(
  input: CreateCheckoutInput,
): Promise<ProviderCheckout> {
  const appUrl = withoutTrailingSlash(input.env.NEXT_PUBLIC_APP_URL)
  const mockUrl = `${appUrl}/?checkout=mock&subscription_id=${input.subscriptionId}`

  if (isAsaasMockMode(input.env)) {
    console.warn('[billing.checkout] Using fallback local mock checkout (detected asaas_dev_* API key)')
    return {
      checkoutId: 'checkout_mock_' + input.subscriptionId,
      checkoutUrl: mockUrl,
      amountCents: PLANS[input.planId].amountCents,
      status: 'pending',
    }
  }

  const plan = PLANS[input.planId]
  const isPix = input.paymentMethod === 'pix'

  const body = {
    billingTypes: [isPix ? 'PIX' : 'CREDIT_CARD'],
    chargeTypes: [isPix ? 'DETACHED' : 'RECURRENT'],
    ...(isPix
      ? {}
      : {
          subscription: {
            cycle: input.planId === 'monthly' ? 'MONTHLY' : 'YEARLY',
          },
        }),
    items: [
      {
        name: `AprovaENF PRO — ${plan.label}`,
        quantity: 1,
        // Asaas uses decimal reais, not cents.
        value: plan.amountCents / 100,
      },
    ],
    callback: {
      successUrl: `${appUrl}/feed?subscription=success`,
      cancelUrl: `${appUrl}/assinar`,
      expiredUrl: `${appUrl}/assinar`,
    },
    // Correlates webhook payments back to our local subscription row.
    externalReference: input.subscriptionId,
  }

  // Prefill the hosted checkout with the logged-in user's name/email. Asaas
  // may reject a partial customerData (no cpfCnpj/phone) as an incomplete
  // manual customer registration, so a rejection falls back to a checkout
  // without prefill — payment must never be blocked by this.
  const customerData = buildCheckoutCustomerData(input.user)

  let data: Record<string, unknown>
  if (customerData) {
    try {
      data = await asaasRequest(input.env, 'POST', '/checkouts', {
        ...body,
        customerData,
      })
    } catch (error) {
      console.warn(
        '[billing.checkout] customerData prefill rejected, retrying without it',
        error instanceof Error ? error.message : error,
      )
      data = await asaasRequest(input.env, 'POST', '/checkouts', body)
    }
  } else {
    data = await asaasRequest(input.env, 'POST', '/checkouts', body)
  }

  const checkoutId = asString(data.id)
  const checkoutUrl = firstString(data.link, data.url, data.checkoutUrl)
  if (!checkoutId || !checkoutUrl) {
    throw new Error(
      `Asaas checkout response missing id or URL: ${JSON.stringify(data).slice(0, 500)}`,
    )
  }

  return {
    checkoutId,
    checkoutUrl,
    amountCents: plan.amountCents,
    status: asString(data.status),
  }
}

/**
 * Stores the Asaas checkout id on the pending row so the first payment webhook
 * can be correlated via payment.checkoutSession even if externalReference is
 * not propagated by Asaas. Replaced by the real subscription id on activation.
 */
export async function attachProviderCheckoutId(
  db: Db,
  subscriptionId: string,
  providerCheckoutId: string,
): Promise<void> {
  const { error } = await db
    .from('subscriptions')
    .update({ provider_subscription_id: providerCheckoutId })
    .eq('id', subscriptionId)
    .eq('status', 'pending')
  if (error) {
    console.error('[billing.checkout] could not attach checkout id', error.message)
  }
}

/** Cancels the recurring subscription at Asaas (card auto-renewal stops). */
export async function cancelAsaasSubscription(input: {
  env: AsaasEnv
  providerSubscriptionId: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await asaasRequest(
      input.env,
      'DELETE',
      `/subscriptions/${encodeURIComponent(input.providerSubscriptionId)}`,
    )
    return { ok: true }
  } catch (error) {
    return { ok: false, error: (error as Error).message }
  }
}

export async function cancelSubscriptionFromWebhook(
  db: Db,
  providerSubscriptionId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await db
    .from('subscriptions')
    .update({ status: 'expired' })
    .eq('provider', PROVIDER)
    .eq('provider_subscription_id', providerSubscriptionId)
    .in('status', ['active', 'past_due'])

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function markSubscriptionPastDueFromWebhook(
  db: Db,
  providerSubscriptionId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await db
    .from('subscriptions')
    .update({ status: 'past_due' })
    .eq('provider', PROVIDER)
    .eq('provider_subscription_id', providerSubscriptionId)
    .eq('status', 'active')

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

/**
 * Expires the local subscription tied to a refunded Asaas payment. Uses the
 * same correlation chain as activation (externalReference → subscription id →
 * checkout session id).
 */
export async function expireSubscriptionFromRefund(
  db: Db,
  payload: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const payment = asRecord(asRecord(payload).payment)
  const found = await findByPaymentCorrelation(db, payment)
  if (!found.ok) return found
  if (!found.row) return { ok: true }

  const { error } = await db
    .from('subscriptions')
    .update({ status: 'expired' })
    .eq('id', found.row.id)
    .in('status', ['active', 'past_due'])

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

/**
 * Activates from an Asaas payment webhook. Card confirms at PAYMENT_CONFIRMED
 * (funds settle ~32 days later at PAYMENT_RECEIVED, far too late to release
 * access); Pix credits instantly at PAYMENT_RECEIVED. Binding each billing
 * type to a single event also prevents the CONFIRMED/RECEIVED pair from
 * activating twice and silently extending the paid period.
 */
export async function activateSubscriptionFromWebhook(
  db: Db,
  payload: unknown,
): Promise<SubscriptionActivationResult> {
  const root = asRecord(payload)
  const eventType = asString(root.event)
  const payment = asRecord(root.payment)
  const billingType = asString(payment.billingType)

  const shouldActivate =
    (eventType === 'PAYMENT_CONFIRMED' && billingType === 'CREDIT_CARD') ||
    (eventType === 'PAYMENT_RECEIVED' && billingType === 'PIX')
  if (!shouldActivate) return { ok: true, activated: false }

  const existing = await findByPaymentCorrelation(db, payment)
  if (!existing.ok) return { ok: false, error: existing.error }
  if (!existing.row) return { ok: false, error: 'missing subscription reference' }

  const userId = existing.row.user_id
  const plan = planFromValue(existing.row.plan)
  if (!plan) return { ok: false, error: 'missing subscription plan on local row' }

  const subscriptionId = existing.row.id
  // A renovação reativa uma linha que já estava `active`; qualquer outro estado
  // anterior (pending/expired/past_due) é ativação inicial.
  const firstActivation = existing.row.status !== 'active'
  const expired = await expireOtherActiveSubscriptions(db, userId, subscriptionId)
  if (!expired.ok) return expired

  // Asaas payments carry no billing-period range; the paid period starts at
  // the payment date and runs one plan cycle.
  const paidAt = dateFromValue(payment.paymentDate) ?? new Date()
  const period = periodForPlan(plan, paidAt)

  const { error } = await db
    .from('subscriptions')
    .update({
      status: 'active',
      provider: PROVIDER,
      provider_customer_id:
        asString(payment.customer) ?? existing.row.provider_customer_id,
      provider_subscription_id:
        asString(payment.subscription) ?? existing.row.provider_subscription_id,
      current_period_start: period.start,
      current_period_end: period.end,
    })
    .eq('id', subscriptionId)
  if (error) return { ok: false, error: error.message }

  return {
    ok: true,
    activated: true,
    firstActivation,
    subscriptionId,
    userId,
    plan,
  }
}

/** Name/email prefill for the hosted checkout; null when nothing to send. */
function buildCheckoutCustomerData(
  user: CheckoutUser,
): { name?: string; email?: string } | null {
  const name = user.name?.trim()
  const email = user.email?.trim()
  if (!name && !email) return null
  return {
    ...(name ? { name } : {}),
    ...(email ? { email } : {}),
  }
}

async function asaasRequest(
  env: AsaasEnv,
  method: 'POST' | 'DELETE' | 'GET',
  path: string,
  body?: unknown,
): Promise<Record<string, unknown>> {
  const response = await fetch(`${getAsaasBaseUrl(env)}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
      access_token: env.ASAAS_API_KEY,
      'User-Agent': 'aprovaenf',
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })

  const text = await response.text()
  if (!response.ok) {
    throw new Error(
      `Asaas ${method} ${path} failed (${response.status}): ${text.slice(0, 500)}`,
    )
  }
  try {
    return asRecord(JSON.parse(text))
  } catch {
    return {}
  }
}

/**
 * Correlation chain for an Asaas payment → local subscription row:
 * 1. payment.externalReference carries our local subscription UUID (set at
 *    checkout creation);
 * 2. payment.subscription matches provider_subscription_id (renewals);
 * 3. payment.checkoutSession matches provider_subscription_id, which holds the
 *    checkout id until the first activation replaces it.
 */
async function findByPaymentCorrelation(
  db: Db,
  payment: Record<string, unknown>,
) {
  const localId = asString(payment.externalReference)
  if (localId) {
    const byId = await findLocalSubscription(db, localId)
    if (!byId.ok || byId.row) return byId
  }

  for (const candidate of [payment.subscription, payment.checkoutSession]) {
    const providerId = asString(candidate)
    if (!providerId) continue
    const byProvider = await findLocalSubscriptionByProviderId(db, providerId)
    if (!byProvider.ok || byProvider.row) return byProvider
  }

  return { ok: true as const, row: null }
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

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    const stringValue = asString(value)
    if (stringValue) return stringValue
  }
  return null
}

function planFromValue(value: unknown): PlanId | null {
  if (value === 'monthly') return 'monthly'
  if (value === 'annual') return 'annual'
  return null
}

function dateFromValue(value: unknown): Date | null {
  const stringValue = asString(value)
  if (!stringValue) return null
  const parsed = new Date(stringValue)
  return Number.isNaN(parsed.getTime()) ? null : parsed
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

async function findLocalSubscription(db: Db, id: string) {
  const { data, error } = await db
    .from('subscriptions')
    .select(
      'id, user_id, plan, status, provider_customer_id, provider_subscription_id',
    )
    .eq('id', id)
    .maybeSingle()

  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, row: data }
}

async function findLocalSubscriptionByProviderId(
  db: Db,
  providerSubscriptionId: string,
) {
  const { data, error } = await db
    .from('subscriptions')
    .select(
      'id, user_id, plan, status, provider_customer_id, provider_subscription_id',
    )
    .eq('provider', PROVIDER)
    .eq('provider_subscription_id', providerSubscriptionId)
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
