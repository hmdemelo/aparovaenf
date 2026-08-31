import { describe, expect, it } from 'vitest'
import { resolveAdminUserStatus } from '@/features/admin/admin-service'

describe('resolveAdminUserStatus', () => {
  it('labels incomplete registrations exactly', () => {
    expect(
      resolveAdminUserStatus({
        registrationCompleted: false,
        subscriptionStatus: null,
      }).label,
    ).toBe('cadastro não concluído')
  })

  it('labels completed non-subscribers as free registrations', () => {
    expect(
      resolveAdminUserStatus({
        registrationCompleted: true,
        subscriptionStatus: null,
      }).label,
    ).toBe('sem plano')
  })

  it('labels completed active subscribers exactly', () => {
    expect(
      resolveAdminUserStatus({
        registrationCompleted: true,
        subscriptionStatus: 'active',
      }).label,
    ).toBe('assinatura ativa')
  })
})
