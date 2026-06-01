import { describe, it, expect } from 'vitest'
import { parseServerEnv } from '@/lib/env/server'

const validEnv = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://abc.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key-value',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key-value',
  ABACATE_PAY_API_KEY: 'abacate-key',
  ABACATE_PAY_WEBHOOK_SECRET: 'webhook-secret',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
}

describe('parseServerEnv', () => {
  it('returns a typed config for a complete, valid environment', () => {
    const env = parseServerEnv(validEnv)
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe('https://abc.supabase.co')
    expect(env.SUPABASE_SERVICE_ROLE_KEY).toBe('service-role-key-value')
    expect(env.NEXT_PUBLIC_APP_URL).toBe('http://localhost:3000')
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
      parseServerEnv({ ...validEnv, ABACATE_PAY_API_KEY: '' }),
    ).toThrow(/ABACATE_PAY_API_KEY/)
  })

  it('aggregates multiple missing variables in a single error message', () => {
    expect(() => parseServerEnv({})).toThrow(/NEXT_PUBLIC_SUPABASE_URL/)
    expect(() => parseServerEnv({})).toThrow(/ABACATE_PAY_WEBHOOK_SECRET/)
  })
})
