import { describe, expect, it } from 'vitest'
import { accountProfileInputSchema } from '@/lib/validation/schemas'

describe('accountProfileInputSchema', () => {
  const valid = {
    name: 'Maria Enfermeira',
    display_name: 'Profa. Maria',
    short_bio: 'Enfermeira aprovada em concursos.',
    instagram: '@profamaria',
  }

  it('accepts a complete valid profile update', () => {
    expect(accountProfileInputSchema.safeParse(valid).success).toBe(true)
  })

  it('trims optional profile fields', () => {
    const result = accountProfileInputSchema.safeParse({
      ...valid,
      short_bio: '  Bio curta  ',
      instagram: '  @perfil  ',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.short_bio).toBe('Bio curta')
      expect(result.data.instagram).toBe('@perfil')
    }
  })

  it('rejects empty required names', () => {
    expect(
      accountProfileInputSchema.safeParse({ ...valid, name: '' }).success,
    ).toBe(false)
    expect(
      accountProfileInputSchema.safeParse({ ...valid, display_name: ' ' }).success,
    ).toBe(false)
  })

  it('rejects bios longer than 280 characters', () => {
    const result = accountProfileInputSchema.safeParse({
      ...valid,
      short_bio: 'a'.repeat(281),
    })

    expect(result.success).toBe(false)
  })
})
