import { describe, expect, it, vi } from 'vitest'
import {
  resolveAdminUserStatus,
  setUserFreeAccess,
} from '@/features/admin/admin-service'

function buildDb(options: {
  updatedRow: { id: string } | null
  updateSpy?: ReturnType<typeof vi.fn>
}) {
  const maybeSingle = vi
    .fn()
    .mockResolvedValue({ data: options.updatedRow, error: null })
  const select = vi.fn(() => ({ maybeSingle }))
  const eq = vi.fn(() => ({ select }))
  const update = options.updateSpy ?? vi.fn(() => ({ eq }))

  return {
    from: vi.fn((table: string) => {
      if (table === 'user_profiles') return { update }
      throw new Error(`Unexpected table: ${table}`)
    }),
    _spies: { update, eq, select, maybeSingle },
  }
}

describe('setUserFreeAccess', () => {
  it('enables free access for an existing user', async () => {
    const db = buildDb({ updatedRow: { id: 'u-1' } })
    const result = await setUserFreeAccess(db as never, 'u-1', true)
    expect(result).toEqual({ ok: true, freeAccess: true })
    expect(db._spies.update).toHaveBeenCalledWith({ free_access: true })
  })

  it('disables free access for an existing user', async () => {
    const db = buildDb({ updatedRow: { id: 'u-1' } })
    const result = await setUserFreeAccess(db as never, 'u-1', false)
    expect(result).toEqual({ ok: true, freeAccess: false })
    expect(db._spies.update).toHaveBeenCalledWith({ free_access: false })
  })

  it('returns not_found when the user does not exist', async () => {
    const db = buildDb({ updatedRow: null })
    const result = await setUserFreeAccess(db as never, 'missing', true)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('not_found')
  })
})

describe('resolveAdminUserStatus with free access', () => {
  it('labels comped users when free access is on and no active subscription', () => {
    expect(
      resolveAdminUserStatus({
        registrationCompleted: true,
        subscriptionStatus: null,
        freeAccess: true,
      }).label,
    ).toBe('acesso liberado (teste)')
  })

  it('keeps the active subscription label even when free access is on', () => {
    expect(
      resolveAdminUserStatus({
        registrationCompleted: true,
        subscriptionStatus: 'active',
        freeAccess: true,
      }).label,
    ).toBe('assinatura ativa')
  })

  it('ignores free access for incomplete registrations', () => {
    expect(
      resolveAdminUserStatus({
        registrationCompleted: false,
        subscriptionStatus: null,
        freeAccess: true,
      }).label,
    ).toBe('cadastro não concluído')
  })
})
