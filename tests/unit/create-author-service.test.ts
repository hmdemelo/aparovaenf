import { describe, expect, it, vi } from 'vitest'
import { createAuthor } from '@/features/admin/admin-service'

describe('createAuthor', () => {
  it('marks trusted admin-created author profiles as registration completed', async () => {
    const sampleValue = 'senhaForte1'
    const deleteUser = vi.fn()
    const createUser = vi.fn().mockResolvedValue({
      data: { user: { id: '00000000-0000-0000-0000-0000000000aa' } },
      error: null,
    })
    const upsert = vi.fn().mockResolvedValue({ error: null })
    const single = vi.fn().mockResolvedValue({
      data: { id: '00000000-0000-0000-0000-0000000000bb' },
      error: null,
    })
    const select = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select })
    const from = vi.fn((table: string) => {
      if (table === 'user_profiles') return { upsert }
      if (table === 'author_profiles') return { insert }
      throw new Error(`Unexpected table ${table}`)
    })

    const result = await createAuthor(
      {
        auth: { admin: { createUser, deleteUser } },
        from,
      } as never,
      {
        email: 'autor@aprovaenf.com.br',
        password: sampleValue,
        name: 'Maria Enfermeira',
        display_name: 'Profa. Maria',
      },
    )

    expect(result.ok).toBe(true)
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'author',
        registration_completed: true,
      }),
    )
  })
})
