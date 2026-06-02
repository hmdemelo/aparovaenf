import 'server-only'
import { getCurrentUser, isSubscriber } from '@/lib/auth/roles'
import { createSupabaseServiceClient } from '@/lib/db/server'
import {
  countAnswersBySession,
  countAnswersByUser,
} from '@/features/questions/question-repository'
import { getAnonymousSessionId } from './anonymous-session'
import { evaluateTrial, type TrialStatus } from './trial-service'

/**
 * Resolve the current trial status from the request.
 *
 * Anonymous answer counts live outside RLS (no anon policy on
 * `answer_attempts`), so counting uses the service client. Auth detection still
 * goes through the user-scoped client inside the role helpers.
 */
export type TrialResolution = {
  status: TrialStatus
  userId: string | null
  anonymousSessionId: string | null
}

export async function resolveTrialStatus(): Promise<TrialResolution> {
  const user = await getCurrentUser()
  const svc = createSupabaseServiceClient()

  if (user) {
    const subscriber = await isSubscriber()
    const answeredAfterSignup = await countAnswersByUser(svc, user.id)
    return {
      status: evaluateTrial({
        isAuthenticated: true,
        isSubscriber: subscriber,
        answeredBeforeSignup: 0,
        answeredAfterSignup,
      }),
      userId: user.id,
      anonymousSessionId: null,
    }
  }

  const anonId = await getAnonymousSessionId()
  const answeredBeforeSignup = anonId
    ? await countAnswersBySession(svc, anonId)
    : 0

  return {
    status: evaluateTrial({
      isAuthenticated: false,
      isSubscriber: false,
      answeredBeforeSignup,
      answeredAfterSignup: 0,
    }),
    userId: null,
    anonymousSessionId: anonId,
  }
}

/** Map a TrialStatus to the API contract shape (snake_case). */
export function serializeTrialStatus(status: TrialStatus) {
  return {
    answered_before_signup: status.answeredBeforeSignup,
    answered_after_signup: status.answeredAfterSignup,
    total_free_answered: status.totalFreeAnswered,
    signup_required: status.signupRequired,
    paywall_required: status.paywallRequired,
    subscription_active: status.subscriptionActive,
    can_answer: status.canAnswer,
  }
}
