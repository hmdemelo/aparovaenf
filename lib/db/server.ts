import 'server-only'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { getCoreServerEnv } from '@/lib/env/server'
import type { Database } from '@/lib/db/database.types'

/**
 * Server-side Supabase clients.
 *
 * - `createSupabaseServerClient` is bound to the request cookies and the user's
 *   session, so all queries run under that user's RLS policies. Use this for
 *   anything acting on behalf of the signed-in user.
 * - `createSupabaseServiceClient` uses the service role key and BYPASSES RLS.
 *   Use it only in trusted server contexts (webhooks, admin jobs, anonymous
 *   trial writes). It must never be imported by client code — the `server-only`
 *   guard above enforces that at build time.
 */

export async function createSupabaseServerClient() {
  const env = getCoreServerEnv()
  const cookieStore = await cookies()

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          } catch {
            // `setAll` is called from Server Components where cookies are
            // read-only. Session refresh is handled by middleware instead.
          }
        },
      },
    },
  )
}

let serviceClient: ReturnType<typeof createClient<Database>> | undefined

export function createSupabaseServiceClient() {
  if (!serviceClient) {
    const env = getCoreServerEnv()
    serviceClient = createClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )
  }
  return serviceClient
}
