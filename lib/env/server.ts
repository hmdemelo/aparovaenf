import 'server-only'
import { z } from 'zod'

/**
 * Server-side environment schema.
 *
 * Validated once at startup so misconfigured deployments fail fast instead of
 * surfacing as runtime errors deep inside auth, billing, or webhook handlers.
 *
 * Only `NEXT_PUBLIC_*` values are safe to reference from browser code. The
 * service role and Asaas secrets MUST stay server-side (see the
 * constitution: Secure Data Boundaries).
 */
const coreServerEnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  GOOGLE_OAUTH_CLIENT_ID: z
    .string()
    .min(1, 'GOOGLE_OAUTH_CLIENT_ID cannot be empty')
    .optional(),
  GOOGLE_OAUTH_CLIENT_SECRET: z
    .string()
    .min(1, 'GOOGLE_OAUTH_CLIENT_SECRET cannot be empty')
    .optional(),
})

const serverEnvSchema = coreServerEnvSchema
  .extend({
    RESEND_API_KEY: z
      .string()
      .min(1, 'RESEND_API_KEY cannot be empty')
      .optional(),
    ASAAS_API_KEY: z.string().min(1, 'ASAAS_API_KEY is required'),
    ASAAS_WEBHOOK_TOKEN: z
      .string()
      .min(1, 'ASAAS_WEBHOOK_TOKEN is required'),
    NEXT_PUBLIC_APP_URL: z
      .string()
      .url('NEXT_PUBLIC_APP_URL must be a valid URL'),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== 'production') return

    // Asaas keys: sandbox starts with $aact_hmlg_, production with $aact_.
    if (
      !env.ASAAS_API_KEY.startsWith('$aact_') ||
      env.ASAAS_API_KEY.startsWith('$aact_hmlg_')
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['ASAAS_API_KEY'],
        message: 'must use a production $aact_ key (not sandbox) in production',
      })
    }
    if (env.ASAAS_WEBHOOK_TOKEN.length < 16) {
      ctx.addIssue({
        code: 'custom',
        path: ['ASAAS_WEBHOOK_TOKEN'],
        message: 'must be at least 16 characters in production',
      })
    }

    const appUrl = new URL(env.NEXT_PUBLIC_APP_URL)
    if (
      appUrl.protocol !== 'https:' ||
      appUrl.hostname === 'localhost' ||
      appUrl.hostname === '127.0.0.1'
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['NEXT_PUBLIC_APP_URL'],
        message: 'must be a public HTTPS URL in production',
      })
    }
  })

export type CoreServerEnv = z.infer<typeof coreServerEnvSchema>
export type ServerEnv = z.infer<typeof serverEnvSchema>

export function parseCoreServerEnv(
  source: Record<string, unknown>,
): CoreServerEnv {
  const result = coreServerEnvSchema.safeParse(source)
  if (!result.success) {
    throw createEnvironmentError(result.error.issues)
  }
  return result.data
}

/**
 * Parse and validate an environment object. Throws a descriptive error listing
 * every offending variable when validation fails. Exported for unit testing and
 * for explicit validation in scripts.
 */
export function parseServerEnv(source: Record<string, unknown>): ServerEnv {
  const result = serverEnvSchema.safeParse(source)
  if (!result.success) {
    throw createEnvironmentError(result.error.issues)
  }
  return result.data
}

function createEnvironmentError(issues: z.core.$ZodIssue[]) {
  const details = issues
    .map((issue) => {
      const key = issue.path.join('.') || '(root)'
      return `  - ${key}: ${issue.message}`
    })
    .join('\n')
  return new Error(`Invalid server environment variables:\n${details}`)
}

let cachedCore: CoreServerEnv | undefined
let cached: ServerEnv | undefined

export function getCoreServerEnv(): CoreServerEnv {
  if (!cachedCore) {
    cachedCore = parseCoreServerEnv(process.env)
  }
  return cachedCore
}

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
