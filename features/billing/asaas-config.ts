import type { ServerEnv } from '@/lib/env/server'

type AsaasModeEnv = Pick<ServerEnv, 'NODE_ENV' | 'ASAAS_API_KEY'>

export const ASAAS_SANDBOX_BASE_URL = 'https://api-sandbox.asaas.com/v3'
export const ASAAS_PRODUCTION_BASE_URL = 'https://api.asaas.com/v3'

/**
 * Local mock checkout for development without an Asaas account, mirroring the
 * old stripe_dev_* convention: an asaas_dev_* key short-circuits the provider.
 */
export function isAsaasMockMode(env: AsaasModeEnv): boolean {
  return (
    env.NODE_ENV !== 'production' &&
    env.ASAAS_API_KEY.startsWith('asaas_dev_')
  )
}

/** Sandbox keys start with $aact_hmlg_; anything else hits production. */
export function getAsaasBaseUrl(env: Pick<ServerEnv, 'ASAAS_API_KEY'>): string {
  return env.ASAAS_API_KEY.startsWith('$aact_hmlg_')
    ? ASAAS_SANDBOX_BASE_URL
    : ASAAS_PRODUCTION_BASE_URL
}
