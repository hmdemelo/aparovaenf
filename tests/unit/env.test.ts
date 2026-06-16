import { describe, it, expect } from 'vitest'
import { parseCoreServerEnv, parseServerEnv } from '@/lib/env/server'

const validEnv = {
  NODE_ENV: 'development',
  NEXT_PUBLIC_SUPABASE_URL: 'https://abc.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key-value',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key-value',
  RESEND_API_KEY: 're_test_key',
  STRIPE_SECRET_KEY: 'stripe-key',
  STRIPE_WEBHOOK_SECRET: 'webhook-secret',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
}

describe('parseServerEnv', () => {
  it('allows the core application to start when billing is not configured', () => {
    const env = parseCoreServerEnv({
      ...validEnv,
      NODE_ENV: 'production',
      STRIPE_SECRET_KEY: '',
      STRIPE_WEBHOOK_SECRET: '',
      STRIPE_MONTHLY_PRICE_ID: '',
      STRIPE_ANNUAL_PRICE_ID: '',
      NEXT_PUBLIC_APP_URL: '',
    })

    expect(env.NODE_ENV).toBe('production')
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe('https://abc.supabase.co')
  })

  it('returns a typed config for a complete, valid environment', () => {
    const env = parseServerEnv(validEnv)
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe('https://abc.supabase.co')
    expect(env.SUPABASE_SERVICE_ROLE_KEY).toBe('service-role-key-value')
    expect(env.NEXT_PUBLIC_APP_URL).toBe('http://localhost:3000')
  })

  it('accepts optional Stripe price settings', () => {
    const env = parseServerEnv({
      ...validEnv,
      STRIPE_MONTHLY_PRICE_ID: 'price_monthly',
      STRIPE_ANNUAL_PRICE_ID: 'price_annual',
    })

    expect(env.STRIPE_MONTHLY_PRICE_ID).toBe('price_monthly')
    expect(env.STRIPE_ANNUAL_PRICE_ID).toBe('price_annual')
  })

  it('accepts a complete live Stripe production configuration', () => {
    const env = parseServerEnv({
      ...validEnv,
      NODE_ENV: 'production',
      STRIPE_SECRET_KEY: 'sk_live_example',
      STRIPE_WEBHOOK_SECRET: 'whsec_example',
      STRIPE_MONTHLY_PRICE_ID: 'price_monthly',
      STRIPE_ANNUAL_PRICE_ID: 'price_annual',
      NEXT_PUBLIC_APP_URL: 'https://aprovaenf.com.br',
    })

    expect(env.NODE_ENV).toBe('production')
    expect(env.STRIPE_SECRET_KEY).toBe('sk_live_example')
  })

  it('rejects mock Stripe credentials in production', () => {
    expect(() =>
      parseServerEnv({
        ...validEnv,
        NODE_ENV: 'production',
        STRIPE_SECRET_KEY: 'stripe_dev_mock_secret_key',
        STRIPE_WEBHOOK_SECRET: 'whsec_example',
        STRIPE_MONTHLY_PRICE_ID: 'price_monthly',
        STRIPE_ANNUAL_PRICE_ID: 'price_annual',
        NEXT_PUBLIC_APP_URL: 'https://aprovaenf.com.br',
      }),
    ).toThrow(/STRIPE_SECRET_KEY/)
  })

  it('requires Stripe price ids and HTTPS app URL in production', () => {
    expect(() =>
      parseServerEnv({
        ...validEnv,
        NODE_ENV: 'production',
        STRIPE_SECRET_KEY: 'sk_live_example',
        STRIPE_WEBHOOK_SECRET: 'whsec_example',
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      }),
    ).toThrow(/STRIPE_MONTHLY_PRICE_ID|STRIPE_ANNUAL_PRICE_ID|NEXT_PUBLIC_APP_URL/)
  })

  it('accepts optional Google OAuth settings without exposing them publicly', () => {
    const env = parseServerEnv({
      ...validEnv,
      GOOGLE_OAUTH_CLIENT_ID: 'google-client-id',
      GOOGLE_OAUTH_CLIENT_SECRET: 'google-client-secret',
    })

    expect(env.GOOGLE_OAUTH_CLIENT_ID).toBe('google-client-id')
    expect(env.GOOGLE_OAUTH_CLIENT_SECRET).toBe('google-client-secret')
  })

  it('throws when a required variable is missing', () => {
    const { SUPABASE_SERVICE_ROLE_KEY, ...incomplete } = validEnv
    void SUPABASE_SERVICE_ROLE_KEY
    expect(() => parseServerEnv(incomplete)).toThrow(/SUPABASE_SERVICE_ROLE_KEY/)
  })

  it('throws when the Supabase URL is not a valid URL', () => {
    expect(() =>
      parseServerEnv({ ...validEnv, NEXT_PUBLIC_SUPABASE_URL: 'not-a-url' }),
    ).toThrow(/NEXT_PUBLIC_SUPABASE_URL/)
  })

  it('throws when the app URL is not a valid URL', () => {
    expect(() =>
      parseServerEnv({ ...validEnv, NEXT_PUBLIC_APP_URL: 'nope' }),
    ).toThrow(/NEXT_PUBLIC_APP_URL/)
  })

  it('rejects empty strings for required secrets', () => {
    expect(() =>
      parseServerEnv({ ...validEnv, STRIPE_SECRET_KEY: '' }),
    ).toThrow(/STRIPE_SECRET_KEY/)
  })

  it('aggregates multiple missing variables in a single error message', () => {
    expect(() => parseServerEnv({})).toThrow(/NEXT_PUBLIC_SUPABASE_URL/)
    expect(() => parseServerEnv({})).toThrow(/STRIPE_WEBHOOK_SECRET/)
  })
})
