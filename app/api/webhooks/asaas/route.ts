import { timingSafeEqual } from 'node:crypto'
import type { NextRequest } from 'next/server'
import { ProductEventNames } from '@/features/analytics/product-events'
import { track } from '@/features/analytics/product-events-server'
import { createPaymentEventRepository } from '@/features/billing/payment-event-repository'
import {
  activateSubscriptionFromWebhook,
  expireSubscriptionFromRefund,
  markSubscriptionPastDueFromWebhook,
} from '@/features/billing/subscription-service'
import { ok, fail, ErrorCodes } from '@/lib/api/response'
import { createSupabaseServiceClient } from '@/lib/db/server'
import { getServerEnv } from '@/lib/env/server'
import {
  sendWelcomeEmail,
  sendPaymentFailedEmail,
} from '@/lib/email/service'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Asaas webhook handler. Asaas authenticates by echoing back the token we
 * configured (asaas-access-token header) — there is no payload signature like
 * Stripe's, so the token comparison is the whole trust boundary.
 */
export async function POST(request: NextRequest) {
  const env = getServerEnv()

  const token = request.headers.get('asaas-access-token')
  if (!token || !safeTokenMatch(token, env.ASAAS_WEBHOOK_TOKEN)) {
    return fail(ErrorCodes.UNAUTHENTICATED, 'Invalid webhook token')
  }

  let event: Record<string, unknown>
  try {
    event = asRecord(await request.json())
  } catch {
    return fail(ErrorCodes.VALIDATION, 'Invalid JSON body')
  }

  const eventType = asString(event.event)
  const payment = asRecord(event.payment)
  // Asaas sends a persistent event id (evt_*); fall back to a deterministic
  // composite so idempotency still holds if it is ever absent.
  const providerEventId =
    asString(event.id) ??
    (asString(payment.id) ? `${eventType}_${asString(payment.id)}` : null)

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
    console.error('[asaas.webhook] could not record event', recorded.error)
    return fail(ErrorCodes.INTERNAL, 'Could not record webhook')
  }

  if (
    recorded.status === 'duplicate' &&
    recorded.event.processing_status === 'processed'
  ) {
    return ok({ received: true, duplicate: true, activated: false })
  }

  let activated = false
  if (eventType === 'PAYMENT_CONFIRMED' || eventType === 'PAYMENT_RECEIVED') {
    const activation = await activateSubscriptionFromWebhook(db, event)
    if (!activation.ok) {
      await events.markFailed(providerEventId, activation.error)
      console.error('[asaas.webhook] processing activation failed', activation.error)
      return fail(ErrorCodes.INTERNAL, 'Could not process webhook')
    }
    if (activation.activated) {
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
      if (activation.firstActivation) {
        const planLabel = activation.plan === 'annual' ? 'Anual' : 'Mensal'
        await sendWelcomeEmail(db, activation.userId, planLabel, env.NEXT_PUBLIC_APP_URL)
      }
    }
  } else if (eventType === 'PAYMENT_OVERDUE') {
    const providerSubscriptionId = asString(payment.subscription)
    // Overdue one-time Pix charges just expire at Asaas; only card renewals
    // move an active subscription to past_due.
    if (providerSubscriptionId) {
      const { data: subData } = await db
        .from('subscriptions')
        .select('user_id')
        .eq('provider', 'asaas')
        .eq('provider_subscription_id', providerSubscriptionId)
        .maybeSingle()

      const pastDue = await markSubscriptionPastDueFromWebhook(
        db,
        providerSubscriptionId,
      )
      if (!pastDue.ok) {
        await events.markFailed(providerEventId, pastDue.error)
        console.error('[asaas.webhook] processing overdue failed', pastDue.error)
        return fail(ErrorCodes.INTERNAL, 'Could not process webhook')
      }

      if (subData?.user_id) {
        const billingUrl = `${env.NEXT_PUBLIC_APP_URL}/assinar`
        await sendPaymentFailedEmail(db, subData.user_id, billingUrl)
      }
    }
  } else if (
    eventType === 'PAYMENT_REFUNDED' ||
    eventType === 'PAYMENT_CHARGEBACK_REQUESTED'
  ) {
    const refund = await expireSubscriptionFromRefund(db, event)
    if (!refund.ok) {
      await events.markFailed(providerEventId, refund.error)
      console.error('[asaas.webhook] processing refund failed', refund.error)
      return fail(ErrorCodes.INTERNAL, 'Could not process webhook')
    }
  }

  const processed = await events.markProcessed(providerEventId)
  if (!processed.ok) {
    console.error('[asaas.webhook] could not mark processed', processed.error)
    return fail(ErrorCodes.INTERNAL, 'Could not process webhook')
  }

  return ok({
    received: true,
    duplicate: recorded.status === 'duplicate',
    activated,
  })
}

function safeTokenMatch(received: string, expected: string): boolean {
  const receivedBuffer = Buffer.from(received)
  const expectedBuffer = Buffer.from(expected)
  if (receivedBuffer.length !== expectedBuffer.length) return false
  return timingSafeEqual(receivedBuffer, expectedBuffer)
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}
