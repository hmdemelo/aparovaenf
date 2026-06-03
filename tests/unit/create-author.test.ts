import { describe, expect, it } from 'vitest'
import {
  createAuthorInputSchema,
  updateAuthorProfileInputSchema,
} from '@/lib/validation/schemas'

describe('createAuthorInputSchema', () => {
  const valid = {
    email: 'autor@aprovaenf.com.br',
    password: 'senhaForte1',
    name: 'Maria Enfermeira',
    display_name: 'Profa. Maria',
    short_bio: 'Enfermeira aprovada em 5 concursos.',
    instagram: '@profamaria',
  }

  it('accepts a complete valid payload', () => {
    const result = createAuthorInputSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('accepts a payload without optional profile fields', () => {
    const result = createAuthorInputSchema.safeParse({
      email: valid.email,
      password: valid.password,
      name: valid.name,
      display_name: valid.display_name,
    })
    expect(result.success).toBe(true)
  })

  it('rejects an invalid email', () => {
    const result = createAuthorInputSchema.safeParse({ ...valid, email: 'nope' })
    expect(result.success).toBe(false)
  })

  it('rejects a password shorter than 8 characters', () => {
    const result = createAuthorInputSchema.safeParse({ ...valid, password: 'curta1' })
    expect(result.success).toBe(false)
  })

  it('rejects an empty display name', () => {
    const result = createAuthorInputSchema.safeParse({ ...valid, display_name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects a bio longer than 280 characters', () => {
    const result = createAuthorInputSchema.safeParse({
      ...valid,
      short_bio: 'a'.repeat(281),
    })
    expect(result.success).toBe(false)
  })
})

describe('updateAuthorProfileInputSchema', () => {
  const valid = {
    display_name: 'Profa. Maria',
    short_bio: 'Enfermeira aprovada em 5 concursos.',
    instagram: '@profamaria',
    is_public: true,
  }

  it('accepts editable author profile fields', () => {
    const result = updateAuthorProfileInputSchema.safeParse(valid)

    expect(result.success).toBe(true)
  })

  it('trims optional text fields', () => {
    const result = updateAuthorProfileInputSchema.safeParse({
      ...valid,
      display_name: '  Profa. Maria  ',
      short_bio: '  Bio curta  ',
      instagram: '  @perfil  ',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.display_name).toBe('Profa. Maria')
      expect(result.data.short_bio).toBe('Bio curta')
      expect(result.data.instagram).toBe('@perfil')
    }
  })

  it('rejects an empty display name and long bio', () => {
    expect(
      updateAuthorProfileInputSchema.safeParse({
        ...valid,
        display_name: ' ',
      }).success,
    ).toBe(false)
    expect(
      updateAuthorProfileInputSchema.safeParse({
        ...valid,
        short_bio: 'a'.repeat(281),
      }).success,
    ).toBe(false)
  })
})
