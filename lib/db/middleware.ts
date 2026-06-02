import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Refresh the Supabase auth session on each request and forward updated cookies.
 * Uses the public env vars directly (middleware may run on the Edge runtime, so
 * we avoid importing the full server env schema / `server-only`).
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          response = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
        },
      },
    },
  )

  // Touch the session so expired tokens get refreshed into the response cookies.
  await supabase.auth.getUser()

  return response
}
