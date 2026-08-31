import { describe, expect, it, vi } from 'vitest'
import {
  getTrialConsumption,
  normalizeTrialEmail,
  recordTrialConsumption,
} from '@/features/trial/trial-consumption'

function buildDb(storedCount: number | null) {
  const maybeSingle = vi.fn().mockResolvedValue({
    data: storedCount === null ? null : { answered_count: storedCount },
    error: null,
  })
  const eq = vi.fn(() => ({ maybeSingle }))
  const select = vi.fn(() => ({ eq }))
  const rpc = vi.fn().mockResolvedValue({ data: null, error: null })

  return {
    from: vi.fn(() => ({ select })),
    rpc,
    _spies: { select, eq, maybeSingle, rpc },
  }
}

describe('normalizeTrialEmail', () => {
  it('lowercases and trims the address', () => {
    expect(normalizeTrialEmail('  Carol06Melo@Gmail.com ')).toBe(
      'carol06melo@gmail.com',
    )
  })

  it('returns null when there is nothing to key on', () => {
    expect(normalizeTrialEmail(null)).toBeNull()
    expect(normalizeTrialEmail(undefined)).toBeNull()
    expect(normalizeTrialEmail('   ')).toBeNull()
  })
})

describe('getTrialConsumption', () => {
  it('returns the spend already recorded for the e-mail', async () => {
    const db = buildDb(3)
    await expect(
      getTrialConsumption(db as never, 'carol06melo@gmail.com'),
    ).resolves.toBe(3)
  })

  it('looks the e-mail up in normalized form', async () => {
    const db = buildDb(3)
    await getTrialConsumption(db as never, '  Carol06Melo@GMAIL.com ')
    expect(db._spies.eq).toHaveBeenCalledWith('email', 'carol06melo@gmail.com')
  })

  it('returns zero for an e-mail that never answered', async () => {
    const db = buildDb(null)
    await expect(getTrialConsumption(db as never, 'novo@x.com')).resolves.toBe(0)
  })

  it('does not query without a usable e-mail', async () => {
    const db = buildDb(3)
    await expect(getTrialConsumption(db as never, null)).resolves.toBe(0)
    expect(db.from).not.toHaveBeenCalled()
  })
})

describe('recordTrialConsumption', () => {
  it('records the spend against the normalized e-mail', async () => {
    const db = buildDb(0)
    await recordTrialConsumption(db as never, ' Carol06Melo@Gmail.com ', 2)
    expect(db._spies.rpc).toHaveBeenCalledWith('record_trial_consumption', {
      p_email: 'carol06melo@gmail.com',
      p_answered_count: 2,
    })
  })

  it('skips the write without a usable e-mail', async () => {
    const db = buildDb(0)
    await recordTrialConsumption(db as never, '', 2)
    expect(db._spies.rpc).not.toHaveBeenCalled()
  })
})
