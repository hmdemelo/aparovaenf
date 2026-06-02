import { describe, it, expect } from 'vitest'
import {
  validateForDraft,
  validateForPublish,
  type QuestionValidationInput,
} from '@/features/questions/question-validation'

function validQuestion(): QuestionValidationInput {
  return {
    statement: 'Enunciado válido da questão?',
    general_comment: 'Comentário geral explicando a resposta.',
    career_id: '00000000-0000-0000-0000-0000000000c1',
    subject_id: '00000000-0000-0000-0000-0000000000s1',
    difficulty: 'media',
    alternatives: [
      { label: 'A', text: 'Alternativa A', is_correct: false },
      { label: 'B', text: 'Alternativa B', is_correct: true },
      { label: 'C', text: 'Alternativa C', is_correct: false },
    ],
  }
}

describe('validateForDraft', () => {
  it('accepts a question with statement, career, subject, and difficulty', () => {
    const result = validateForDraft({ ...validQuestion(), general_comment: undefined })
    expect(result.valid).toBe(true)
  })

  it('requires a statement', () => {
    const result = validateForDraft({ ...validQuestion(), statement: '   ' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('statement is required')
  })

  it('does not require a general comment for a draft', () => {
    const result = validateForDraft({ ...validQuestion(), general_comment: '' })
    expect(result.valid).toBe(true)
  })
})

describe('validateForPublish', () => {
  it('accepts a fully valid question', () => {
    const result = validateForPublish(validQuestion())
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('requires a general comment', () => {
    const result = validateForPublish({ ...validQuestion(), general_comment: '  ' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('general comment is required to publish')
  })

  it('requires at least two alternatives', () => {
    const result = validateForPublish({
      ...validQuestion(),
      alternatives: [{ label: 'A', text: 'Só uma', is_correct: true }],
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('at least two alternatives are required')
  })

  it('requires exactly one correct alternative — none is invalid', () => {
    const result = validateForPublish({
      ...validQuestion(),
      alternatives: [
        { label: 'A', text: 'A', is_correct: false },
        { label: 'B', text: 'B', is_correct: false },
      ],
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('exactly one correct alternative is required')
  })

  it('requires exactly one correct alternative — two is invalid', () => {
    const result = validateForPublish({
      ...validQuestion(),
      alternatives: [
        { label: 'A', text: 'A', is_correct: true },
        { label: 'B', text: 'B', is_correct: true },
      ],
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('exactly one correct alternative is required')
  })

  it('rejects alternatives with empty text', () => {
    const result = validateForPublish({
      ...validQuestion(),
      alternatives: [
        { label: 'A', text: '  ', is_correct: true },
        { label: 'B', text: 'B', is_correct: false },
      ],
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('every alternative needs text')
  })

  it('accumulates multiple errors', () => {
    const result = validateForPublish({
      statement: '',
      general_comment: '',
      career_id: '00000000-0000-0000-0000-0000000000c1',
      subject_id: '00000000-0000-0000-0000-0000000000s1',
      difficulty: 'media',
      alternatives: [],
    })
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThanOrEqual(2)
  })
})
