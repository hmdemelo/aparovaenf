import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Load `.env.local` into process.env for integration tests that hit the local
 * Supabase database. Returns false when the file or Supabase URL is missing, so
 * suites can skip cleanly in environments without local Supabase.
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

  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)
}
