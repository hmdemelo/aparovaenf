import { describe, expect, it, vi } from 'vitest'
import { adminChangeUserPassword } from '@/features/admin/admin-service'

function validPasswordInput() {
  return 'example-pass-123'
}

function createServiceDb(options?: {
  profileFound?: boolean
  authError?: { message: string } | null
}) {
  const maybeSingle = vi.fn().mockResolvedValue({
    data:
      options?.profileFound === false
        ? null
        : { id: '00000000-0000-0000-0000-0000000000a4' },
    error: null,
  })
  const select = vi.fn(() => ({ maybeSingle }))
  const eq = vi.fn(() => ({ select }))
  const update = vi.fn(() => ({ eq }))
  const from = vi.fn(() => ({ update }))
  const updateUserById = vi.fn().mockResolvedValue({
    error: options?.authError ?? null,
  })

  return {
    db: {
      from,
      auth: { admin: { updateUserById } },
    },
    from,
    update,
    updateUserById,
  }
}

describe('adminChangeUserPassword', () => {
  it('marks the profile before replacing the authentication password', async () => {
    const { db, update, updateUserById } = createServiceDb()

    const result = await adminChangeUserPassword(db as never, 'user-1', {
      password: validPasswordInput(),
    })

    expect(result).toEqual({ ok: true })
    expect(update).toHaveBeenNthCalledWith(1, { force_password_change: true })
    expect(update.mock.invocationCallOrder[0]).toBeLessThan(
      updateUserById.mock.invocationCallOrder[0],
    )
  })

  it('does not replace the auth password when the profile does not exist', async () => {
    const { db, updateUserById } = createServiceDb({ profileFound: false })

    const result = await adminChangeUserPassword(db as never, 'missing-user', {
      password: validPasswordInput(),
    })

    expect(result).toMatchObject({ ok: false, code: 'not_found' })
    expect(updateUserById).not.toHaveBeenCalled()
  })

  it('attempts to clear the flag when the auth password update fails', async () => {
    const { db, update } = createServiceDb({
      authError: { message: 'auth failure' },
    })

    const result = await adminChangeUserPassword(db as never, 'user-1', {
      password: validPasswordInput(),
    })

    expect(result).toMatchObject({ ok: false, code: 'error' })
    expect(update).toHaveBeenNthCalledWith(2, { force_password_change: false })
  })
})
