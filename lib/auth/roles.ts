import 'server-only'
import { evaluateSubscriptionAccess } from '@/features/billing/subscription-rules'
import { createSupabaseServerClient } from '@/lib/db/server'
import type { UserRole } from '@/lib/validation/schemas'

/**
 * Server-side authorization helpers.
 *
 * Authorization decisions MUST happen on the server (constitution: Secure Data
 * Boundaries). These read the session from the request-scoped Supabase client
 * and the user's role from `user_profiles`.
 */

export type CurrentUser = {
  id: string
  email: string | null
  role: UserRole
  registrationCompleted: boolean
  forcePasswordChange: boolean
  freeAccess: boolean
}

/** Returns the authenticated user with role, or null if not signed in. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('user_profiles')
    .select(
      'role, email, registration_completed, force_password_change, free_access',
    )
    .eq('id', user.id)
    .single()

  return {
    id: user.id,
    email: profile?.email ?? user.email ?? null,
    role: (profile?.role as UserRole) ?? 'student',
    registrationCompleted: profile?.registration_completed ?? false,
    forcePasswordChange: profile?.force_password_change ?? false,
    freeAccess: profile?.free_access ?? false,
  }
}

export async function isAuthenticated(): Promise<boolean> {
  return (await getCurrentUser()) !== null
}

export async function hasRole(role: UserRole): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === role
}

export async function isAdmin(): Promise<boolean> {
  return hasRole('admin')
}

/**
 * Require an authenticated user, optionally with one of the allowed roles.
 * Throws an {@link AuthorizationError} the caller can map to a 401/403 envelope.
 */
export async function requireUser(
  allowedRoles?: UserRole[],
): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) {
    throw new AuthorizationError('unauthenticated', 'Authentication required')
  }
  if (user.forcePasswordChange) {
    throw new AuthorizationError(
      'forbidden',
      'Password change required before continuing',
    )
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new AuthorizationError(
      'forbidden',
      `Requires one of: ${allowedRoles.join(', ')}`,
    )
  }
  return user
}

/** Returns true when the current user has an active subscription. */
export async function isSubscriber(): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false

  // Admin-granted free access bypasses the subscription requirement entirely.
  if (user.freeAccess) return true

  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('subscriptions')
    .select('status, current_period_end')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('current_period_end', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()

  return evaluateSubscriptionAccess({
    isAuthenticated: true,
    status: data?.status ?? null,
    currentPeriodEnd: data?.current_period_end ?? null,
  }).isSubscriber
}

export class AuthorizationError extends Error {
  constructor(
    public readonly kind: 'unauthenticated' | 'forbidden',
    message: string,
  ) {
    super(message)
    this.name = 'AuthorizationError'
  }
}
