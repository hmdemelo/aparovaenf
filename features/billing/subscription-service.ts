import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/db/database.types'
import type { ServerEnv } from '@/lib/env/server'
import { PLANS, type PlanId } from './plans'

type Db = SupabaseClient<Database>
const ABACATE_PAY_API_BASE_URL = 'https://api.abacatepay.com/v2'
const PROVIDER = 'abacate_pay'

const ACTIVATION_EVENTS = new Set([
  'checkout.completed',
  'subscription.completed',
  'subscription.renewed',
])

type CheckoutUser = {
  id: string
  email: string | null
}

type CreateCheckoutInput = {
  env: Pick<
    ServerEnv,
    | 'ABACATE_PAY_API_KEY'
    | 'NEXT_PUBLIC_APP_URL'
    | 'ABACATE_PAY_MONTHLY_PRODUCT_ID'
    | 'ABACATE_PAY_ANNUAL_PRODUCT_ID'
  >
  planId: PlanId
  subscriptionId: string
  user: CheckoutUser
  fetcher?: typeof fetch
}

export type ProviderCheckout = {
  checkoutId: string
  checkoutUrl: string
  amountCents: number
  status: string | null
}

type ProviderResponse = {
  success?: boolean
  error?: unknown
  data?: {
    id?: string
    url?: string
    amount?: number
    status?: string
  } | null
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

export async function createAbacateCheckout(
  input: CreateCheckoutInput,
): Promise<ProviderCheckout> {
  const { endpoint, body } = buildAbacateCheckoutRequest(input)
  const fetcher = input.fetcher ?? fetch
  const response = await fetcher(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.env.ABACATE_PAY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  let payload: ProviderResponse
  try {
    payload = (await response.json()) as ProviderResponse
  } catch {
    throw new Error('Invalid Abacate Pay response')
  }

  if (!response.ok || payload.success !== true || !payload.data?.url) {
    throw new Error('Abacate Pay checkout creation failed')
  }

  return {
    checkoutId: payload.data.id ?? input.subscriptionId,
    checkoutUrl: payload.data.url,
    amountCents: payload.data.amount ?? PLANS[input.planId].amountCents,
    status: payload.data.status ?? null,
  }
}

export function buildAbacateCheckoutRequest(input: CreateCheckoutInput) {
  const plan = PLANS[input.planId]
  const productId = getAbacateProductId(input.planId, input.env)
  const appUrl = withoutTrailingSlash(input.env.NEXT_PUBLIC_APP_URL)
  const baseBody = {
    items: [{ id: productId, quantity: 1 }],
    externalId: input.subscriptionId,
    returnUrl: `${appUrl}/feed`,
    completionUrl: `${appUrl}/feed?subscription=success`,
    metadata: {
      user_id: input.user.id,
      ...(input.user.email ? { user_email: input.user.email } : {}),
      plan: plan.id,
      subscription_id: input.subscriptionId,
    },
  }

  if (plan.id === 'annual') {
    return {
      endpoint: `${ABACATE_PAY_API_BASE_URL}/checkouts/create`,
      body: {
        ...baseBody,
        methods: ['PIX', 'CARD'],
        card: { maxInstallments: 12 },
      },
    }
  }

  return {
    endpoint: `${ABACATE_PAY_API_BASE_URL}/subscriptions/create`,
    body: {
      ...baseBody,
      methods: ['CARD'],
    },
  }
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

function getAbacateProductId(
  planId: PlanId,
  env: Pick<
    ServerEnv,
    'ABACATE_PAY_MONTHLY_PRODUCT_ID' | 'ABACATE_PAY_ANNUAL_PRODUCT_ID'
  >,
): string {
  const value =
    planId === 'monthly'
      ? env.ABACATE_PAY_MONTHLY_PRODUCT_ID
      : env.ABACATE_PAY_ANNUAL_PRODUCT_ID
  return value?.trim() || `aprovaenf-${planId}`
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

function firstNumber(...values: unknown[]): number | null {
  for (const value of values) {
    const numberValue = asNumber(value)
    if (numberValue !== null) return numberValue
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

function planFromAmount(amount: number | null): PlanId | null {
  if (amount === PLANS.monthly.amountCents) return 'monthly'
  if (amount === PLANS.annual.amountCents) return 'annual'
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

function safeDate(value: string | null): Date {
  if (!value) return new Date()
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? new Date() : date
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
  const eventType = asString(root.event) ?? asString(root.type)
  if (!eventType || !ACTIVATION_EVENTS.has(eventType)) {
    return { ok: true, activated: false }
  }

  const data = asRecord(root.data)
  const checkout = asRecord(data.checkout)
  const subscription = asRecord(data.subscription)
  const payment = asRecord(data.payment)
  const customer = asRecord(data.customer)
  const metadata = {
    ...asRecord(data.metadata),
    ...asRecord(subscription.metadata),
    ...asRecord(payment.metadata),
    ...asRecord(checkout.metadata),
  }

  const localSubscriptionId = firstString(
    metadata.subscription_id,
    metadata.subscriptionId,
    checkout.externalId,
    payment.externalId,
    subscription.externalId,
    data.externalId,
    root.externalId,
  )
  const userId = firstString(
    metadata.user_id,
    metadata.userId,
    data.user_id,
    data.userId,
  )
  const amount = firstNumber(
    subscription.amount,
    checkout.amount,
    payment.amount,
    payment.paidAmount,
    data.amount,
  )
  const plan =
    planFromValue(metadata.plan) ??
    planFromValue(subscription.frequency) ??
    planFromAmount(amount)

  if (!plan) return { ok: false, error: 'missing subscription plan' }

  const paidAt = safeDate(
    firstString(payment.updatedAt, checkout.updatedAt, subscription.updatedAt),
  )
  const period = periodForPlan(plan, paidAt)

  return {
    ok: true,
    activated: true,
    localSubscriptionId,
    userId,
    plan,
    providerCustomerId: firstString(customer.id, checkout.customerId),
    providerSubscriptionId: firstString(subscription.id, checkout.id, payment.id),
    periodStart: period.start,
    periodEnd: period.end,
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
