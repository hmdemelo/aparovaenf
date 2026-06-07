import { describe, expect, it } from 'vitest'
import { resolvePostLoginPath } from '@/lib/auth/post-login'

describe('resolvePostLoginPath', () => {
  const base = { isSubscriber: false, launchCareerSlug: 'enfermagem' as string | null }

  it('sends admins to the admin panel', () => {
    expect(
      resolvePostLoginPath({ ...base, role: 'admin', next: '/feed?career=enfermagem' }),
    ).toBe('/admin')
  })

  it('forces password replacement before honoring any role destination', () => {
    expect(
      resolvePostLoginPath({
        ...base,
        role: 'admin',
        forcePasswordChange: true,
        next: '/admin/users',
      }),
    ).toBe('/force-password?next=%2Fadmin%2Fusers')
  })

  it('sends admins to subpages of the admin panel if next points to one', () => {
    expect(
      resolvePostLoginPath({ ...base, role: 'admin', next: '/admin/questions' }),
    ).toBe('/admin/questions')
  })

  it('sends authors to the author questions panel', () => {
    expect(
      resolvePostLoginPath({ ...base, role: 'author', next: '/feed?career=enfermagem' }),
    ).toBe('/author/questions')
  })

  it('honors a feed `next` even for non-subscribers (allowing trial access)', () => {
    expect(
      resolvePostLoginPath({
        ...base,
        role: 'student',
        isSubscriber: false,
        next: '/feed?career=enfermagem',
      }),
    ).toBe('/feed?career=enfermagem')
  })

  it('sends students without an active plan to the paywall if next is missing', () => {
    expect(
      resolvePostLoginPath({
        ...base,
        role: 'student',
        isSubscriber: false,
        next: null,
      }),
    ).toBe('/assinar')
  })

  it('honors a feed `next` for paying students', () => {
    expect(
      resolvePostLoginPath({
        ...base,
        role: 'student',
        isSubscriber: true,
        next: '/feed?career=enfermagem',
      }),
    ).toBe('/feed?career=enfermagem')
  })

  it('falls back to the launch-career feed when `next` is the landing page', () => {
    expect(
      resolvePostLoginPath({ ...base, role: 'student', isSubscriber: true, next: '/' }),
    ).toBe('/feed?career=enfermagem')
  })

  it('falls back to the launch-career feed when `next` is missing', () => {
    expect(
      resolvePostLoginPath({ ...base, role: 'student', isSubscriber: true, next: null }),
    ).toBe('/feed?career=enfermagem')
  })

  it('never honors the paywall path as `next` for paying students', () => {
    expect(
      resolvePostLoginPath({
        ...base,
        role: 'student',
        isSubscriber: true,
        next: '/assinar',
      }),
    ).toBe('/feed?career=enfermagem')
  })

  it('rejects unsafe protocol-relative `next` values', () => {
    expect(
      resolvePostLoginPath({
        ...base,
        role: 'student',
        isSubscriber: true,
        next: '//evil.example.com',
      }),
    ).toBe('/feed?career=enfermagem')
  })

  it('goes to the landing page when no launch career exists', () => {
    expect(
      resolvePostLoginPath({
        role: 'student',
        isSubscriber: true,
        launchCareerSlug: null,
        next: null,
      }),
    ).toBe('/')
  })
})
