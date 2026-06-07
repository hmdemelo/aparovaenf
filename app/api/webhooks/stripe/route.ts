import type { NextRequest } from 'next/server'
import { ProductEventNames } from '@/features/analytics/product-events'
import { track } from '@/features/analytics/product-events-server'
import { createPaymentEventRepository } from '@/features/billing/payment-event-repository'
import {
  activateSubscriptionFromWebhook,
  cancelSubscriptionFromWebhook,
  markSubscriptionPastDueFromWebhook,
} from '@/features/billing/subscription-service'
import { ok, fail, ErrorCodes } from '@/lib/api/response'
import { createSupabaseServiceClient } from '@/lib/db/server'
import { getServerEnv } from '@/lib/env/server'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const env = getServerEnv()
  const rawBody = await request.text()
  const signature = request.headers.get('stripe-signature')

  let event: Stripe.Event

  try {
    if (!signature) {
      return fail(ErrorCodes.UNAUTHENTICATED, 'Missing stripe signature header')
    }
    const stripe = new Stripe(env.STRIPE_SECRET_KEY)
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    )
  } catch (err: unknown) {
    console.error('[stripe.webhook] signature verification failed', (err as Error).message)
    return fail(ErrorCodes.UNAUTHENTICATED, 'Webhook signature verification failed')
  }

  const providerEventId = event.id
  const eventType = event.type

  if (!providerEventId || !eventType) {
    return fail(ErrorCodes.VALIDATION, 'Missing webhook event id or type')
  }

  const db = createSupabaseServiceClient()
  const events = createPaymentEventRepository(db)
  const recorded = await events.recordReceived({
    providerEventId,
    eventType,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: event as any,
  })
  if (!recorded.ok) {
    console.error('[stripe.webhook] could not record event', recorded.error)
    return fail(ErrorCodes.INTERNAL, 'Could not record webhook')
  }

  if (
    recorded.status === 'duplicate' &&
    recorded.event.processing_status === 'processed'
  ) {
    return ok({
      received: true,
      duplicate: true,
      activated: false,
    })
  }

  let activated = false
  if (eventType === 'checkout.session.completed' || eventType === 'invoice.paid') {
    const activation = await activateSubscriptionFromWebhook(db, event)
    if (!activation.ok) {
      await events.markFailed(providerEventId, activation.error)
      console.error('[stripe.webhook] processing activation failed', activation.error)
      return fail(ErrorCodes.INTERNAL, 'Could not process webhook')
    }
    if (activation.ok && activation.activated) {
      activated = true
      await track({
        event_name: ProductEventNames.SUBSCRIPTION_ACTIVATED,
        user_id: activation.userId,
        metadata: {
          plan: activation.plan,
          subscription_id: activation.subscriptionId,
          provider_event_id: providerEventId,
          event_type: eventType,
        },
      })
    }
  } else if (eventType === 'customer.subscription.deleted') {
    const obj = event.data.object as Stripe.Subscription
    const cancellation = await cancelSubscriptionFromWebhook(db, obj.id)
    if (!cancellation.ok) {
      await events.markFailed(providerEventId, cancellation.error)
      console.error('[stripe.webhook] processing cancellation failed', cancellation.error)
      return fail(ErrorCodes.INTERNAL, 'Could not process webhook')
    }
  } else if (eventType === 'invoice.payment_failed') {
    const providerSubscriptionId = subscriptionIdFromInvoice(event.data.object)
    if (!providerSubscriptionId) {
      await events.markFailed(
        providerEventId,
        'missing Stripe subscription id on failed invoice',
      )
      return fail(ErrorCodes.INTERNAL, 'Could not process webhook')
    }
    const pastDue = await markSubscriptionPastDueFromWebhook(
      db,
      providerSubscriptionId,
    )
    if (!pastDue.ok) {
      await events.markFailed(providerEventId, pastDue.error)
      console.error('[stripe.webhook] processing payment failure failed', pastDue.error)
      return fail(ErrorCodes.INTERNAL, 'Could not process webhook')
    }
  }

  const processed = await events.markProcessed(providerEventId)
  if (!processed.ok) {
    console.error('[stripe.webhook] could not mark processed', processed.error)
    return fail(ErrorCodes.INTERNAL, 'Could not process webhook')
  }

  return ok({
    received: true,
    duplicate: recorded.status === 'duplicate',
    activated,
  })
}

function subscriptionIdFromInvoice(value: unknown): string | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const invoice = value as Record<string, unknown>
  const direct = stripeObjectId(invoice.subscription)
  if (direct) return direct

  const parent = asRecord(invoice.parent)
  const details = asRecord(parent.subscription_details)
  return stripeObjectId(details.subscription)
}

function stripeObjectId(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value
  const record = asRecord(value)
  return typeof record.id === 'string' && record.id.trim() ? record.id : null
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}
