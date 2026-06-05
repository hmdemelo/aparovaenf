import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Load `.env.local` into process.env for integration tests that hit the local
 * Supabase database. Returns false when local credentials are missing, or when
 * `.env.local` points at a remote Supabase project, so seed-dependent suites
 * skip cleanly instead of running against the wrong database.
 */
export function loadLocalEnv(): boolean {
  const path = resolve(process.cwd(), '.env.local')
  if (!existsSync(path)) return false

  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim()
    if (!(key in process.env)) process.env[key] = value
  }

  return hasRequiredLocalSupabaseEnv()
}

function hasRequiredLocalSupabaseEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      isLocalSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL),
  )
}

function isLocalSupabaseUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return ['localhost', '127.0.0.1', '::1', '[::1]'].includes(url.hostname)
  } catch {
    return false
  }
}
