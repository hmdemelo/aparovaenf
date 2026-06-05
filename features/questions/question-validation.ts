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
  career_id?: string | null
  subject_id?: string | null
  difficulty?: Difficulty | null
  alternatives?: AlternativeValidationInput[]
}

export type ValidationResult = { valid: boolean; errors: string[] }

function isBlank(value: string | undefined | null): boolean {
  return !value || value.trim().length === 0
}

function validateStatement(input: QuestionValidationInput, errors: string[]) {
  if (isBlank(input.statement)) errors.push('Enunciado é obrigatório.')
}

function validatePublishClassification(
  input: QuestionValidationInput,
  errors: string[],
) {
  if (!input.career_id) errors.push('Carreira é obrigatória para publicar.')
  if (!input.subject_id) errors.push('Disciplina é obrigatória para publicar.')
  if (!input.difficulty) errors.push('Dificuldade é obrigatória para publicar.')
}

export function validateForDraft(input: QuestionValidationInput): ValidationResult {
  const errors: string[] = []
  validateStatement(input, errors)
  return { valid: errors.length === 0, errors }
}

export function validateForPublish(input: QuestionValidationInput): ValidationResult {
  const errors: string[] = []
  validateStatement(input, errors)
  validatePublishClassification(input, errors)

  if (isBlank(input.general_comment)) {
    errors.push('Comentário geral é obrigatório para publicar.')
  }

  const alternatives = input.alternatives ?? []
  if (alternatives.length < 2) {
    errors.push('Informe pelo menos duas alternativas.')
  }
  if (alternatives.some((a) => isBlank(a.text))) {
    errors.push('Todas as alternativas precisam de texto.')
  }
  const correctCount = alternatives.filter((a) => a.is_correct).length
  if (correctCount !== 1) {
    errors.push('Marque exatamente uma alternativa correta.')
  }

  return { valid: errors.length === 0, errors }
}
