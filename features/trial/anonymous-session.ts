import 'server-only'
import { cookies } from 'next/headers'

/**
 * Anonymous trial session.
 *
 * Pre-signup visitors are tracked by an opaque session id stored in an
 * HttpOnly cookie. This is what ties the 2 anonymous answers to a single
 * visitor without an account. The id is a UUID so it can be stored directly in
 * `answer_attempts.anonymous_session_id`.
 */

export const ANON_SESSION_COOKIE = 'aprovaenf_anon'
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

/** Read the current anonymous session id, if any. */
export async function getAnonymousSessionId(): Promise<string | null> {
  const store = await cookies()
  return store.get(ANON_SESSION_COOKIE)?.value ?? null
}

/**
 * Return the existing anonymous session id or create and persist a new one.
 * Safe to call from Route Handlers (cookies are writable there).
 */
export async function ensureAnonymousSessionId(): Promise<string> {
  const store = await cookies()
  const existing = store.get(ANON_SESSION_COOKIE)?.value
  if (existing) return existing

  const id = crypto.randomUUID()
  store.set(ANON_SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ONE_YEAR_SECONDS,
  })
  return id
}
