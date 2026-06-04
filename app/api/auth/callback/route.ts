import { NextResponse } from 'next/server'
import { isSubscriber, getCurrentUser } from '@/lib/auth/roles'
import { resolvePostLoginPath } from '@/lib/auth/post-login'
import { getLaunchCareerSlug } from '@/lib/db/launch-career'
import { createSupabaseServerClient } from '@/lib/db/server'
import { authCallbackQuerySchema } from '@/lib/validation/schemas'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type AuthCallbackError =
  | 'invalid_link'
  | 'missing_code'
  | 'provider_error'
  | 'session_missing'

function redirectToLogin(
  requestUrl: URL,
  next: string,
  authError: AuthCallbackError,
) {
  const loginUrl = new URL('/login', requestUrl.origin)
  loginUrl.searchParams.set('auth_error', authError)
  loginUrl.searchParams.set('next', next)
  return NextResponse.redirect(loginUrl)
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const parsed = authCallbackQuerySchema.safeParse(
    Object.fromEntries(requestUrl.searchParams.entries()),
  )
  const next = parsed.success ? parsed.data.next : '/'

  if (!parsed.success) {
    return redirectToLogin(requestUrl, next, 'invalid_link')
  }

  if (parsed.data.error) {
    return redirectToLogin(requestUrl, next, 'provider_error')
  }

  if (!parsed.data.code) {
    return redirectToLogin(requestUrl, next, 'missing_code')
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.exchangeCodeForSession(parsed.data.code)
  if (error) {
    return redirectToLogin(requestUrl, next, 'invalid_link')
  }

  const user = await getCurrentUser()
  if (!user) {
    return redirectToLogin(requestUrl, next, 'session_missing')
  }

  let subscriber = false
  let launchCareerSlug: string | null = null
  if (user.role === 'student') {
    subscriber = await isSubscriber()
    if (subscriber) {
      launchCareerSlug = await getLaunchCareerSlug()
    }
  }

  const destination = resolvePostLoginPath({
    role: user.role,
    isSubscriber: subscriber,
    launchCareerSlug,
    next,
  })

  return NextResponse.redirect(new URL(destination, requestUrl.origin))
}
