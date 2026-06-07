import type { UserRole } from '@/lib/validation/schemas'

/**
 * Resolves where a user lands after authentication, based on role and
 * subscription status. Pure and unit-testable: callers gather the context
 * (role, subscription, launch career) server-side and pass it in.
 *
 * Rules (see navigation spec):
 * - admin  -> /admin
 * - author -> /author/questions
 * - student with safe requested `next` -> requested path
 * - student with active plan and no next -> launch-career feed
 * - student without active plan and no next -> /assinar
 *
 * Feed and student pages still enforce trial/subscription access server-side.
 */

export const SUBSCRIBE_PATH = '/assinar'

export type PostLoginContext = {
  role: UserRole
  isSubscriber: boolean
  launchCareerSlug: string | null
  forcePasswordChange?: boolean
  next?: string | null
}

// Paths we never honor as a post-login `next`: auth screens, the landing page,
// and the paywall itself (a paying student should never be sent back to it).
const EXCLUDED_NEXT = ['/', '/login', '/signup', SUBSCRIBE_PATH]

function isSafeNext(next: string | null | undefined): next is string {
  if (typeof next !== 'string') return false
  if (!next.startsWith('/') || next.startsWith('//')) return false
  return !EXCLUDED_NEXT.some(
    (path) =>
      next === path ||
      next.startsWith(`${path}?`) ||
      (path !== '/' && next.startsWith(`${path}/`)),
  )
}

function launchFeed(slug: string | null): string {
  return slug ? `/feed?career=${slug}` : '/'
}

export function resolvePostLoginPath(ctx: PostLoginContext): string {
  if (ctx.forcePasswordChange) {
    const next = isSafeNext(ctx.next) ? ctx.next : '/'
    return `/force-password?next=${encodeURIComponent(next)}`
  }

  if (ctx.role === 'admin') {
    return isSafeNext(ctx.next) && ctx.next.startsWith('/admin') ? ctx.next : '/admin'
  }
  if (ctx.role === 'author') return '/author/questions'

  // student: a safe requested path is honored; page-level guards enforce access.
  if (isSafeNext(ctx.next)) return ctx.next
  if (!ctx.isSubscriber) return SUBSCRIBE_PATH
  return launchFeed(ctx.launchCareerSlug)
}
