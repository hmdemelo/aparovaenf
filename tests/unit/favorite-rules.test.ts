import { describe, it, expect } from 'vitest'
import { evaluateFavoriteAccess } from '@/features/student-feed/favorites-service'

describe('evaluateFavoriteAccess', () => {
  it('allows active subscribers to persist favorites', () => {
    const result = evaluateFavoriteAccess({ isAuthenticated: true, isSubscriber: true })
    expect(result.allowed).toBe(true)
  })

  it('blocks authenticated non-subscribers with a subscription prompt', () => {
    const result = evaluateFavoriteAccess({
      isAuthenticated: true,
      isSubscriber: false,
    })
    expect(result.allowed).toBe(false)
    if (!result.allowed) expect(result.reason).toBe('subscription_required')
  })

  it('blocks anonymous visitors as unauthenticated', () => {
    const result = evaluateFavoriteAccess({
      isAuthenticated: false,
      isSubscriber: false,
    })
    expect(result.allowed).toBe(false)
    if (!result.allowed) expect(result.reason).toBe('unauthenticated')
  })
})
