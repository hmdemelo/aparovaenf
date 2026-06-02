import type { SubscriptionStatus } from '@/lib/validation/schemas'

export type SubscriptionAccessReason =
  | 'unauthenticated'
  | 'pending'
  | 'past_due'
  | 'canceled'
  | 'expired'
  | 'missing'

export type SubscriptionAccessContext = {
  isAuthenticated: boolean
  status?: SubscriptionStatus | null
  currentPeriodEnd?: string | Date | null
  now?: Date
}

export type SubscriptionAccess = {
  isSubscriber: boolean
  requiresAuthentication: boolean
  subscriptionRequired: boolean
  reason?: SubscriptionAccessReason
}

export function evaluateSubscriptionAccess(
  ctx: SubscriptionAccessContext,
): SubscriptionAccess {
  if (!ctx.isAuthenticated) {
    return {
      isSubscriber: false,
      requiresAuthentication: true,
      subscriptionRequired: false,
      reason: 'unauthenticated',
    }
  }

  if (!ctx.status) {
    return blocked('missing')
  }

  if (ctx.status !== 'active') {
    return blocked(ctx.status)
  }

  if (isEnded(ctx.currentPeriodEnd, ctx.now ?? new Date())) {
    return blocked('expired')
  }

  return {
    isSubscriber: true,
    requiresAuthentication: false,
    subscriptionRequired: false,
  }
}

function blocked(reason: Exclude<SubscriptionAccessReason, 'unauthenticated'>) {
  return {
    isSubscriber: false,
    requiresAuthentication: false,
    subscriptionRequired: true,
    reason,
  }
}

function isEnded(value: SubscriptionAccessContext['currentPeriodEnd'], now: Date) {
  if (!value) return false
  const end = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(end.getTime())) return true
  return end.getTime() <= now.getTime()
}
