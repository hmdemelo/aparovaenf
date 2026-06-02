import { createHmac, timingSafeEqual } from 'node:crypto'
import type { NextRequest } from 'next/server'
import { ProductEventNames } from '@/features/analytics/product-events'
import { track } from '@/features/analytics/product-events-server'
import { createPaymentEventRepository } from '@/features/billing/payment-event-repository'
import { activateSubscriptionFromWebhook } from '@/features/billing/subscription-service'
import { ok, fail, ErrorCodes } from '@/lib/api/response'
import { createSupabaseServiceClient } from '@/lib/db/server'
import { getServerEnv } from '@/lib/env/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const env = getServerEnv()
  const webhookSecret = request.nextUrl.searchParams.get('webhookSecret')
  if (!webhookSecret || !secureCompare(webhookSecret, env.ABACATE_PAY_WEBHOOK_SECRET)) {
    return fail(ErrorCodes.UNAUTHENTICATED, 'Invalid webhook secret')
  }

  const rawBody = await request.text()
  const signature = request.headers.get('x-webhook-signature')
  if (signature) {
    if (!env.ABACATE_PAY_WEBHOOK_PUBLIC_KEY) {
      return fail(ErrorCodes.UNAUTHENTICATED, 'Webhook signature key not configured')
    }
    if (
      !verifyAbacateSignature(
        rawBody,
        signature,
        env.ABACATE_PAY_WEBHOOK_PUBLIC_KEY,
      )
    ) {
      return fail(ErrorCodes.UNAUTHENTICATED, 'Invalid webhook signature')
    }
  }

  let payload: unknown
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return fail(ErrorCodes.VALIDATION, 'Invalid JSON body')
  }

  const providerEventId = extractString(payload, 'id')
  const eventType =
    extractString(payload, 'event') ??
    extractString(payload, 'type') ??
    extractString(payload, 'event_type')
  if (!providerEventId || !eventType) {
    return fail(ErrorCodes.VALIDATION, 'Missing webhook event id or type')
  }

  const db = createSupabaseServiceClient()
  const events = createPaymentEventRepository(db)
  const recorded = await events.recordReceived({
    providerEventId,
    eventType,
    payload,
  })
  if (!recorded.ok) {
    console.error('[abacate.webhook] could not record event', recorded.error)
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

  const activation = await activateSubscriptionFromWebhook(db, payload)
  if (!activation.ok) {
    await events.markFailed(providerEventId, activation.error)
    console.error('[abacate.webhook] processing failed', activation.error)
    return fail(ErrorCodes.INTERNAL, 'Could not process webhook')
  }

  const processed = await events.markProcessed(providerEventId)
  if (!processed.ok) {
    console.error('[abacate.webhook] could not mark processed', processed.error)
    return fail(ErrorCodes.INTERNAL, 'Could not process webhook')
  }

  if (activation.activated) {
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

  return ok({
    received: true,
    duplicate: recorded.status === 'duplicate',
    activated: activation.activated,
  })
}

function verifyAbacateSignature(
  rawBody: string,
  signatureFromHeader: string,
  publicKey: string,
) {
  const expected = createHmac('sha256', publicKey)
    .update(Buffer.from(rawBody, 'utf8'))
    .digest('base64')
  return secureCompare(expected, signatureFromHeader)
}

function secureCompare(expected: string, received: string) {
  const expectedBuffer = Buffer.from(expected)
  const receivedBuffer = Buffer.from(received)
  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  )
}

function extractString(payload: unknown, key: string): string | null {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    return null
  }
  const value = (payload as Record<string, unknown>)[key]
  return typeof value === 'string' && value.trim() ? value : null
}
