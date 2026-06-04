import { describe, expect, it } from 'vitest'
import {
  authCallbackQuerySchema,
  authEmailSchema,
  buildAuthCallbackUrl,
  normalizeAuthRedirectPath,
} from '@/lib/validation/schemas'

describe('auth redirect validation', () => {
  it('keeps safe in-app paths with query strings', () => {
    expect(normalizeAuthRedirectPath('/feed?career=enfermeiro-a')).toBe(
      '/feed?career=enfermeiro-a',
    )
  })

  it('rejects absolute and protocol-relative redirects', () => {
    expect(normalizeAuthRedirectPath('https://evil.example/feed')).toBe('/')
    expect(normalizeAuthRedirectPath('//evil.example/feed')).toBe('/')
  })

  it('normalizes missing redirects to the landing page', () => {
    expect(normalizeAuthRedirectPath(undefined)).toBe('/')
    expect(normalizeAuthRedirectPath('')).toBe('/')
  })

  it('parses callback query parameters into a safe shape', () => {
    const parsed = authCallbackQuerySchema.parse({
      code: 'oauth-code',
      next: '/feed?career=enfermeiro-a',
    })

    expect(parsed).toEqual({
      code: 'oauth-code',
      next: '/feed?career=enfermeiro-a',
    })
  })

  it('uses the normalized path when building callback URLs', () => {
    expect(
      buildAuthCallbackUrl('https://aprovaenf.test', '//evil.example/path'),
    ).toBe('https://aprovaenf.test/api/auth/callback?next=%2F')
  })

  it('validates auth e-mail input', () => {
    expect(authEmailSchema.parse(' aluno@aprovaenf.local ')).toBe(
      'aluno@aprovaenf.local',
    )
    expect(() => authEmailSchema.parse('sem-email')).toThrow(/e-mail/)
  })
})
