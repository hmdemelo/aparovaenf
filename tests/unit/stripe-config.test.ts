import { describe, expect, it } from 'vitest'
import { isStripeMockMode } from '@/features/billing/stripe-config'

describe('Stripe environment mode', () => {
  it('enables mock checkout only for an explicit development placeholder', () => {
    expect(
      isStripeMockMode({
        NODE_ENV: 'development',
        STRIPE_SECRET_KEY: 'stripe_dev_mock_secret_key',
      }),
    ).toBe(true)
  })

  it('never enables mock checkout in production', () => {
    expect(
      isStripeMockMode({
        NODE_ENV: 'production',
        STRIPE_SECRET_KEY: 'stripe_dev_mock_secret_key',
      }),
    ).toBe(false)
  })

  it('does not treat Stripe test keys as mock checkout', () => {
    expect(
      isStripeMockMode({
        NODE_ENV: 'development',
        STRIPE_SECRET_KEY: 'sk_test_example',
      }),
    ).toBe(false)
  })
})
