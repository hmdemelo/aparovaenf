import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AnswerFeedback } from '@/features/student-feed/answer-feedback'
import type { AnswerResponse } from '@/features/student-feed/types'

const feedback: AnswerResponse = {
  is_correct: true,
  correct_alternative_id: 'alt-1',
  general_comment: 'A lavagem das mãos é **essencial** para o controle de infecção.',
  selected_alternative_comment: 'Você marcou a *correta*.',
  trial_status: {
    answered_after_signup: 1,
    remaining_free: 2,
    signup_required: false,
    paywall_required: false,
    subscription_active: false,
    can_answer: true,
  },
}

describe('AnswerFeedback', () => {
  it('renders markdown in the general comment', () => {
    render(<AnswerFeedback feedback={feedback} onNext={vi.fn()} />)

    const bold = screen.getByText('essencial')
    expect(bold.tagName).toBe('STRONG')
  })

  it('renders markdown in the selected alternative comment', () => {
    render(<AnswerFeedback feedback={feedback} onNext={vi.fn()} />)

    const italic = screen.getByText('correta')
    expect(italic.tagName).toBe('EM')
  })
})
