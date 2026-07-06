import { describe, expect, it } from 'vitest'
import {
  getAsaasBaseUrl,
  isAsaasMockMode,
} from '@/features/billing/asaas-config'

describe('Asaas environment mode', () => {
  it('enables mock checkout only for an explicit development placeholder', () => {
    expect(
      isAsaasMockMode({
        NODE_ENV: 'development',
        ASAAS_API_KEY: 'asaas_dev_mock_api_key',
      }),
    ).toBe(true)
  })

  it('never enables mock checkout in production', () => {
    expect(
      isAsaasMockMode({
        NODE_ENV: 'production',
        ASAAS_API_KEY: 'asaas_dev_mock_api_key',
      }),
    ).toBe(false)
  })

  it('does not treat real Asaas keys as mock checkout', () => {
    expect(
      isAsaasMockMode({
        NODE_ENV: 'development',
        ASAAS_API_KEY: '$aact_hmlg_example',
      }),
    ).toBe(false)
  })
})

describe('Asaas base URL', () => {
  it('routes sandbox keys to the sandbox API', () => {
    expect(getAsaasBaseUrl({ ASAAS_API_KEY: '$aact_hmlg_example' })).toBe(
      'https://api-sandbox.asaas.com/v3',
    )
  })

  it('routes production keys to the production API', () => {
    expect(getAsaasBaseUrl({ ASAAS_API_KEY: '$aact_prod_example' })).toBe(
      'https://api.asaas.com/v3',
    )
  })
})
