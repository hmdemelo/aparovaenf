import 'server-only'
import { z } from 'zod'

/**
 * Server-side environment schema.
 *
 * Validated once at startup so misconfigured deployments fail fast instead of
 * surfacing as runtime errors deep inside auth, billing, or webhook handlers.
 *
 * Only `NEXT_PUBLIC_*` values are safe to reference from browser code. The
 * service role and Abacate Pay secrets MUST stay server-side (see the
 * constitution: Secure Data Boundaries).
 */
const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY is required'),
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .min(1, 'STRIPE_WEBHOOK_SECRET is required'),
  STRIPE_MONTHLY_PRICE_ID: z
    .string()
    .min(1, 'STRIPE_MONTHLY_PRICE_ID cannot be empty')
    .optional(),
  STRIPE_ANNUAL_PRICE_ID: z
    .string()
    .min(1, 'STRIPE_ANNUAL_PRICE_ID cannot be empty')
    .optional(),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url('NEXT_PUBLIC_APP_URL must be a valid URL'),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>

/**
 * Parse and validate an environment object. Throws a descriptive error listing
 * every offending variable when validation fails. Exported for unit testing and
 * for explicit validation in scripts.
 */
export function parseServerEnv(source: Record<string, unknown>): ServerEnv {
  const result = serverEnvSchema.safeParse(source)
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => {
        const key = issue.path.join('.') || '(root)'
        return `  - ${key}: ${issue.message}`
      })
      .join('\n')
    throw new Error(`Invalid server environment variables:\n${issues}`)
  }
  return result.data
}

let cached: ServerEnv | undefined

/**
 * Lazily validated, cached server environment. Use this from server code that
 * needs configuration. The first access validates `process.env`.
 */
export function getServerEnv(): ServerEnv {
  if (!cached) {
    cached = parseServerEnv(process.env)
  }
  return cached
}
