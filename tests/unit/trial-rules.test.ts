import { describe, it, expect } from 'vitest'
import {
  POST_SIGNUP_TRIAL_LIMIT,
  evaluateTrial,
  type TrialContext,
} from '@/features/trial/trial-service'

const base: TrialContext = {
  isAuthenticated: false,
  isSubscriber: false,
  answeredAfterSignup: 0,
}

describe('trial limits', () => {
  it('uses 3 as the post-signup free limit', () => {
    expect(POST_SIGNUP_TRIAL_LIMIT).toBe(3)
  })
})

describe('anonymous visitor', () => {
  it('always requires signup before answering', () => {
    const status = evaluateTrial(base)
    expect(status.canAnswer).toBe(false)
    expect(status.signupRequired).toBe(true)
    expect(status.paywallRequired).toBe(false)
  })
})

describe('registered non-subscriber', () => {
  const authed: TrialContext = { ...base, isAuthenticated: true }

  it('can answer three free questions after signup', () => {
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
    const status = evaluateTrial({ ...authed, answeredAfterSignup: 1 })
    expect(status.signupRequired).toBe(false)
  })

  it('reports how many free questions remain', () => {
    expect(evaluateTrial({ ...authed, answeredAfterSignup: 0 }).remainingFree).toBe(3)
    expect(evaluateTrial({ ...authed, answeredAfterSignup: 2 }).remainingFree).toBe(1)
    expect(evaluateTrial({ ...authed, answeredAfterSignup: 5 }).remainingFree).toBe(0)
  })
})

describe('active subscriber', () => {
  it('can always answer regardless of counts', () => {
    const status = evaluateTrial({
      isAuthenticated: true,
      isSubscriber: true,
      answeredAfterSignup: 99,
    })
    expect(status.canAnswer).toBe(true)
    expect(status.signupRequired).toBe(false)
    expect(status.paywallRequired).toBe(false)
    expect(status.subscriptionActive).toBe(true)
  })
})
