/**
 * Trial rules — the core gating logic for the student learning loop.
 *
 * Product rules (decided 2026-07: the feed is login-only):
 *  - Anonymous visitors cannot answer; they are sent to signup first.
 *  - A registered non-subscriber may answer 3 free questions.
 *  - Only *answered* questions consume trial; viewing does not.
 *  - Active subscribers have an unlimited feed.
 *
 * This module is pure so the rules can be unit tested without a database.
 * Callers supply the answered counts; persistence lives in the feed repository.
 */

export const POST_SIGNUP_TRIAL_LIMIT = 3

export type TrialContext = {
  /** Whether the request belongs to an authenticated user. */
  isAuthenticated: boolean
  /** Whether the user has an active subscription. */
  isSubscriber: boolean
  /** Answers made by the authenticated user. */
  answeredAfterSignup: number
}

export type TrialStatus = {
  answeredAfterSignup: number
  /** Free questions still available to a registered non-subscriber; null for subscribers. */
  remainingFree: number | null
  /** Anonymous visitor must sign up before answering. */
  signupRequired: boolean
  /** Registered non-subscriber reached the free limit. */
  paywallRequired: boolean
  subscriptionActive: boolean
  /** Whether the next answer submission is allowed. */
  canAnswer: boolean
}

export function evaluateTrial(ctx: TrialContext): TrialStatus {
  // Subscribers bypass all gates.
  if (ctx.isSubscriber) {
    return {
      answeredAfterSignup: ctx.answeredAfterSignup,
      remainingFree: null,
      signupRequired: false,
      paywallRequired: false,
      subscriptionActive: true,
      canAnswer: true,
    }
  }

  // The feed is login-only: anonymous visitors always go to signup first.
  if (!ctx.isAuthenticated) {
    return {
      answeredAfterSignup: 0,
      remainingFree: 0,
      signupRequired: true,
      paywallRequired: false,
      subscriptionActive: false,
      canAnswer: false,
    }
  }

  // Authenticated non-subscriber: 3 free answers after signup.
  const paywallRequired = ctx.answeredAfterSignup >= POST_SIGNUP_TRIAL_LIMIT
  return {
    answeredAfterSignup: ctx.answeredAfterSignup,
    remainingFree: Math.max(0, POST_SIGNUP_TRIAL_LIMIT - ctx.answeredAfterSignup),
    signupRequired: false,
    paywallRequired,
    subscriptionActive: false,
    canAnswer: !paywallRequired,
  }
}
