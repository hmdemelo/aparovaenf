import 'server-only'
import { getCurrentUser, isSubscriber } from '@/lib/auth/roles'
import { createSupabaseServiceClient } from '@/lib/db/server'
import { countAnswersByUser } from '@/features/questions/question-repository'
import { evaluateTrial, type TrialStatus } from './trial-service'

/**
 * Resolve the current trial status from the request.
 *
 * The feed is login-only, so anonymous requests resolve to a signup-required
 * status without touching the database. Auth detection goes through the
 * user-scoped client inside the role helpers; answer counting uses the service
 * client.
 */
export type TrialResolution = {
  status: TrialStatus
  userId: string | null
  passwordChangeRequired: boolean
}

export async function resolveTrialStatus(): Promise<TrialResolution> {
  const user = await getCurrentUser()

  if (!user) {
    return {
      status: evaluateTrial({
        isAuthenticated: false,
        isSubscriber: false,
        answeredAfterSignup: 0,
      }),
      userId: null,
      passwordChangeRequired: false,
    }
  }

  if (user.forcePasswordChange) {
    return {
      status: evaluateTrial({
        isAuthenticated: true,
        isSubscriber: false,
        answeredAfterSignup: 0,
      }),
      userId: user.id,
      passwordChangeRequired: true,
    }
  }

  const svc = createSupabaseServiceClient()
  const subscriber = await isSubscriber()
  const answeredAfterSignup = await countAnswersByUser(svc, user.id)
  return {
    status: evaluateTrial({
      isAuthenticated: true,
      isSubscriber: subscriber,
      answeredAfterSignup,
    }),
    userId: user.id,
    passwordChangeRequired: false,
  }
}

/** Map a TrialStatus to the API contract shape (snake_case). */
export function serializeTrialStatus(status: TrialStatus) {
  return {
    answered_after_signup: status.answeredAfterSignup,
    remaining_free: status.remainingFree,
    signup_required: status.signupRequired,
    paywall_required: status.paywallRequired,
    subscription_active: status.subscriptionActive,
    can_answer: status.canAnswer,
  }
}
