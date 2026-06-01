import { describe, it, expect } from 'vitest'
import {
  ANONYMOUS_TRIAL_LIMIT,
  POST_SIGNUP_TRIAL_LIMIT,
  TOTAL_FREE_LIMIT,
  evaluateTrial,
  type TrialContext,
} from '@/features/trial/trial-service'

const base: TrialContext = {
  isAuthenticated: false,
  isSubscriber: false,
  answeredBeforeSignup: 0,
  answeredAfterSignup: 0,
}

describe('trial limits', () => {
  it('uses 2 / 3 / 5 as the anonymous, post-signup, and total limits', () => {
    expect(ANONYMOUS_TRIAL_LIMIT).toBe(2)
    expect(POST_SIGNUP_TRIAL_LIMIT).toBe(3)
    expect(TOTAL_FREE_LIMIT).toBe(5)
  })
})

describe('anonymous visitor', () => {
  it('can answer the first two questions', () => {
    expect(evaluateTrial({ ...base, answeredBeforeSignup: 0 }).canAnswer).toBe(true)
    expect(evaluateTrial({ ...base, answeredBeforeSignup: 1 }).canAnswer).toBe(true)
  })

  it('requires signup after answering two questions', () => {
    const status = evaluateTrial({ ...base, answeredBeforeSignup: 2 })
    expect(status.canAnswer).toBe(false)
    expect(status.signupRequired).toBe(true)
    expect(status.paywallRequired).toBe(false)
  })

  it('does not require signup before the limit is reached', () => {
    expect(evaluateTrial({ ...base, answeredBeforeSignup: 1 }).signupRequired).toBe(
      false,
    )
  })
})

describe('registered non-subscriber', () => {
  const authed: TrialContext = { ...base, isAuthenticated: true }

  it('can answer three more questions after signup', () => {
    expect(evaluateTrial({ ...authed, answeredAfterSignup: 0 }).canAnswer).toBe(true)
    expect(evaluateTrial({ ...authed, answeredAfterSignup: 2 }).canAnswer).toBe(true)
  })

  it('hits the paywall after three post-signup answers', () => {
    const status = evaluateTrial({ ...authed, answeredAfterSignup: 3 })
    expect(status.canAnswer).toBe(false)
    expect(status.paywallRequired).toBe(true)
    expect(status.signupRequired).toBe(false)
  })

  it('never asks an authenticated user to sign up again', () => {
    const status = evaluateTrial({
      ...authed,
      answeredBeforeSignup: 2,
      answeredAfterSignup: 1,
    })
    expect(status.signupRequired).toBe(false)
  })

  it('reports total free answered across both phases', () => {
    const status = evaluateTrial({
      ...authed,
      answeredBeforeSignup: 2,
      answeredAfterSignup: 1,
    })
    expect(status.totalFreeAnswered).toBe(3)
  })
})

describe('active subscriber', () => {
  it('can always answer regardless of counts', () => {
    const status = evaluateTrial({
      isAuthenticated: true,
      isSubscriber: true,
      answeredBeforeSignup: 2,
      answeredAfterSignup: 99,
    })
    expect(status.canAnswer).toBe(true)
    expect(status.signupRequired).toBe(false)
    expect(status.paywallRequired).toBe(false)
    expect(status.subscriptionActive).toBe(true)
  })
})
