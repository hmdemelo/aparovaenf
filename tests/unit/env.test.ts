import { describe, it, expect } from 'vitest'
import { parseCoreServerEnv, parseServerEnv } from '@/lib/env/server'

const validEnv = {
  NODE_ENV: 'development',
  NEXT_PUBLIC_SUPABASE_URL: 'https://abc.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key-value',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key-value',
  RESEND_API_KEY: 're_test_key',
  ASAAS_API_KEY: 'asaas_dev_mock_api_key',
  ASAAS_WEBHOOK_TOKEN: 'webhook-token-value',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
}

describe('parseServerEnv', () => {
  it('allows the core application to start when billing is not configured', () => {
    const env = parseCoreServerEnv({
      ...validEnv,
      NODE_ENV: 'production',
      ASAAS_API_KEY: '',
      ASAAS_WEBHOOK_TOKEN: '',
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

  it('accepts a complete live Asaas production configuration', () => {
    const env = parseServerEnv({
      ...validEnv,
      NODE_ENV: 'production',
      ASAAS_API_KEY: '$aact_prod_example_key',
      ASAAS_WEBHOOK_TOKEN: 'a-long-production-webhook-token',
      NEXT_PUBLIC_APP_URL: 'https://aprovaenf.com.br',
    })

    expect(env.NODE_ENV).toBe('production')
    expect(env.ASAAS_API_KEY).toBe('$aact_prod_example_key')
  })

  it('rejects mock Asaas credentials in production', () => {
    expect(() =>
      parseServerEnv({
        ...validEnv,
        NODE_ENV: 'production',
        ASAAS_API_KEY: 'asaas_dev_mock_api_key',
        ASAAS_WEBHOOK_TOKEN: 'a-long-production-webhook-token',
        NEXT_PUBLIC_APP_URL: 'https://aprovaenf.com.br',
      }),
    ).toThrow(/ASAAS_API_KEY/)
  })

  it('rejects a sandbox Asaas key in production', () => {
    expect(() =>
      parseServerEnv({
        ...validEnv,
        NODE_ENV: 'production',
        ASAAS_API_KEY: '$aact_hmlg_example_key',
        ASAAS_WEBHOOK_TOKEN: 'a-long-production-webhook-token',
        NEXT_PUBLIC_APP_URL: 'https://aprovaenf.com.br',
      }),
    ).toThrow(/ASAAS_API_KEY/)
  })

  it('requires a strong webhook token and HTTPS app URL in production', () => {
    expect(() =>
      parseServerEnv({
        ...validEnv,
        NODE_ENV: 'production',
        ASAAS_API_KEY: '$aact_prod_example_key',
        ASAAS_WEBHOOK_TOKEN: 'short',
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      }),
    ).toThrow(/ASAAS_WEBHOOK_TOKEN|NEXT_PUBLIC_APP_URL/)
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
      parseServerEnv({ ...validEnv, ASAAS_API_KEY: '' }),
    ).toThrow(/ASAAS_API_KEY/)
  })

  it('aggregates multiple missing variables in a single error message', () => {
    expect(() => parseServerEnv({})).toThrow(/NEXT_PUBLIC_SUPABASE_URL/)
    expect(() => parseServerEnv({})).toThrow(/ASAAS_WEBHOOK_TOKEN/)
  })
})
