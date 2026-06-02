/**
 * Trial rules — the core gating logic for the student learning loop.
 *
 * Product rules (constitution + spec FR-003..FR-006):
 *  - A visitor may answer 2 questions before signup is required.
 *  - A registered non-subscriber may answer 3 more (5 free in total).
 *  - Only *answered* questions consume trial; viewing does not.
 *  - Active subscribers have an unlimited feed.
 *
 * This module is pure so the rules can be unit tested without a database.
 * Callers supply the answered counts; persistence lives in the feed repository.
 */

export const ANONYMOUS_TRIAL_LIMIT = 2
export const POST_SIGNUP_TRIAL_LIMIT = 3
export const TOTAL_FREE_LIMIT = 5

export type TrialContext = {
  /** Whether the request belongs to an authenticated user. */
  isAuthenticated: boolean
  /** Whether the user has an active subscription. */
  isSubscriber: boolean
  /** Answers made in the anonymous (pre-signup) session. */
  answeredBeforeSignup: number
  /** Answers made by the authenticated user (post-signup). */
  answeredAfterSignup: number
}

export type TrialStatus = {
  answeredBeforeSignup: number
  answeredAfterSignup: number
  totalFreeAnswered: number
  /** Anonymous visitor reached the pre-signup limit. */
  signupRequired: boolean
  /** Registered non-subscriber reached the free limit. */
  paywallRequired: boolean
  subscriptionActive: boolean
  /** Whether the next answer submission is allowed. */
  canAnswer: boolean
}

export function evaluateTrial(ctx: TrialContext): TrialStatus {
  const totalFreeAnswered = ctx.answeredBeforeSignup + ctx.answeredAfterSignup

  // Subscribers bypass all gates.
  if (ctx.isSubscriber) {
    return {
      answeredBeforeSignup: ctx.answeredBeforeSignup,
      answeredAfterSignup: ctx.answeredAfterSignup,
      totalFreeAnswered,
      signupRequired: false,
      paywallRequired: false,
      subscriptionActive: true,
      canAnswer: true,
    }
  }

  if (!ctx.isAuthenticated) {
    const signupRequired = ctx.answeredBeforeSignup >= ANONYMOUS_TRIAL_LIMIT
    return {
      answeredBeforeSignup: ctx.answeredBeforeSignup,
      answeredAfterSignup: 0,
      totalFreeAnswered: ctx.answeredBeforeSignup,
      signupRequired,
      paywallRequired: false,
      subscriptionActive: false,
      canAnswer: !signupRequired,
    }
  }

  // Authenticated non-subscriber: 3 free answers after signup.
  const paywallRequired = ctx.answeredAfterSignup >= POST_SIGNUP_TRIAL_LIMIT
  return {
    answeredBeforeSignup: ctx.answeredBeforeSignup,
    answeredAfterSignup: ctx.answeredAfterSignup,
    totalFreeAnswered,
    signupRequired: false,
    paywallRequired,
    subscriptionActive: false,
    canAnswer: !paywallRequired,
  }
}
