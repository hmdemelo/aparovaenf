'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/db/database.types'

/**
 * Browser Supabase client, scoped to the user's session. Only the public anon
 * key is used here; the service role key must never reach the browser.
 */
let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined

export function createSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  }
  return browserClient
}
