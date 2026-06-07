import { cookies } from 'next/headers'
import { getCurrentUser, isSubscriber } from '@/lib/auth/roles'
import { resolvePostLoginPath } from '@/lib/auth/post-login'
import { getLaunchCareerSlug } from '@/lib/db/launch-career'
import { ok, fail, ErrorCodes } from '@/lib/api/response'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Resolves the post-authentication destination for the current session.
 * The login/signup forms call this after a successful sign-in and navigate to
 * the returned `destination`. Authorization context is read server-side; the
 * role/subscription decision is never trusted from the client.
 */
export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return fail(ErrorCodes.UNAUTHENTICATED, 'Authentication required')
  }

  let next = new URL(request.url).searchParams.get('next')

  if (!next || next === '/') {
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

  if (user.forcePasswordChange) {
    return ok({
      destination: resolvePostLoginPath({
        role: user.role,
        isSubscriber: false,
        launchCareerSlug: null,
        forcePasswordChange: true,
        next,
      }),
    })
  }

  let subscriber = false
  let launchCareerSlug: string | null = null
  if (user.role === 'student') {
    subscriber = await isSubscriber()
    if (subscriber) launchCareerSlug = await getLaunchCareerSlug()
  }

  const destination = resolvePostLoginPath({
    role: user.role,
    isSubscriber: subscriber,
    launchCareerSlug,
    next,
  })

  return ok({ destination })
}
