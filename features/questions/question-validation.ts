import type { Difficulty } from '@/lib/validation/schemas'

/**
 * Question publish/draft validation — pure rules, unit tested.
 *
 * Draft: enough to save work in progress (statement + classification).
 * Publish: full integrity per spec FR-016..FR-018 and data-model.md —
 * general comment, >=2 alternatives, exactly one correct, all with text.
 */

export type AlternativeValidationInput = {
  label?: string
  text: string
  is_correct: boolean
}

export type QuestionValidationInput = {
  statement: string
  general_comment?: string
  career_id?: string
  subject_id?: string
  difficulty?: Difficulty
  alternatives?: AlternativeValidationInput[]
}

export type ValidationResult = { valid: boolean; errors: string[] }

function isBlank(value: string | undefined | null): boolean {
  return !value || value.trim().length === 0
}

function validateClassification(input: QuestionValidationInput, errors: string[]) {
  if (isBlank(input.statement)) errors.push('statement is required')
  if (!input.career_id) errors.push('career is required')
  if (!input.subject_id) errors.push('subject is required')
  if (!input.difficulty) errors.push('difficulty is required')
}

export function validateForDraft(input: QuestionValidationInput): ValidationResult {
  const errors: string[] = []
  validateClassification(input, errors)
  return { valid: errors.length === 0, errors }
}

export function validateForPublish(input: QuestionValidationInput): ValidationResult {
  const errors: string[] = []
  validateClassification(input, errors)

  if (isBlank(input.general_comment)) {
    errors.push('general comment is required to publish')
  }

  const alternatives = input.alternatives ?? []
  if (alternatives.length < 2) {
    errors.push('at least two alternatives are required')
  }
  if (alternatives.some((a) => isBlank(a.text))) {
    errors.push('every alternative needs text')
  }
  const correctCount = alternatives.filter((a) => a.is_correct).length
  if (correctCount !== 1) {
    errors.push('exactly one correct alternative is required')
  }

  return { valid: errors.length === 0, errors }
}
