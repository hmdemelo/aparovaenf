import { describe, expect, it } from 'vitest'
import { createSubjectInputSchema } from '@/lib/validation/schemas'
import { slugify } from '@/lib/text/slugify'

const CAREER_ID = '00000000-0000-0000-0000-0000000000c1'

describe('createSubjectInputSchema', () => {
  it('accepts a name and career_id without an explicit slug', () => {
    const result = createSubjectInputSchema.safeParse({
      name: 'Saúde da Mulher',
      career_id: CAREER_ID,
    })
    expect(result.success).toBe(true)
  })

  it('rejects a missing career_id', () => {
    const result = createSubjectInputSchema.safeParse({ name: 'Saúde Mental' })
    expect(result.success).toBe(false)
  })

  it('rejects an empty name', () => {
    const result = createSubjectInputSchema.safeParse({
      name: '   ',
      career_id: CAREER_ID,
    })
    expect(result.success).toBe(false)
  })
})

describe('slugify', () => {
  it('strips accents and lowercases', () => {
    expect(slugify('Saúde da Criança')).toBe('saude-da-crianca')
  })

  it('collapses punctuation and whitespace into single hyphens', () => {
    expect(slugify('  Ética e Legislação!! ')).toBe('etica-e-legislacao')
  })

  it('produces an empty string for symbol-only input', () => {
    expect(slugify('@#$%')).toBe('')
  })
})
