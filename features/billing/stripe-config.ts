import type { ServerEnv } from '@/lib/env/server'

type StripeModeEnv = Pick<ServerEnv, 'NODE_ENV' | 'STRIPE_SECRET_KEY'>

export function isStripeMockMode(env: StripeModeEnv): boolean {
  return (
    env.NODE_ENV !== 'production' &&
    env.STRIPE_SECRET_KEY.startsWith('stripe_dev_')
  )
}
