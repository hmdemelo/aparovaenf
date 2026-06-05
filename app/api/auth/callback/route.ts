import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { isSubscriber } from '@/lib/auth/roles'
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
  let next = parsed.success ? parsed.data.next : '/'

  if (next === '/' || next === '') {
    try {
      const cookieStore = await cookies()
      const selectedCareer = cookieStore.get('selected_career')?.value
      if (selectedCareer) {
        next = `/feed?career=${selectedCareer}`
      }
    } catch {
      // ignore cookies() call outside request context in tests
    }
  }

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

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return redirectToLogin(requestUrl, next, 'session_missing')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, registration_completed')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? 'student'
  const isGoogle = user.app_metadata?.provider === 'google' || user.app_metadata?.providers?.includes('google')
  let registrationCompleted = profile?.registration_completed ?? false

  if (isGoogle && !registrationCompleted) {
    await supabase
      .from('user_profiles')
      .update({ registration_completed: true })
      .eq('id', user.id)
    registrationCompleted = true
  }

  if (!registrationCompleted) {
    const completeUrl = new URL('/completar-cadastro', requestUrl.origin)
    completeUrl.searchParams.set('next', next)
    return NextResponse.redirect(completeUrl)
  }

  let subscriber = false
  let launchCareerSlug: string | null = null
  if (role === 'student') {
    subscriber = await isSubscriber()
    if (subscriber) {
      launchCareerSlug = await getLaunchCareerSlug()
    }
  }

  const destination = resolvePostLoginPath({
    role,
    isSubscriber: subscriber,
    launchCareerSlug,
    next,
  })

  return NextResponse.redirect(new URL(destination, requestUrl.origin))
}
