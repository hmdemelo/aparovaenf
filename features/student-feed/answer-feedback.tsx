'use client'

import { Check, X } from 'lucide-react'
import type { AnswerResponse } from './types'

type AnswerFeedbackProps = {
  feedback: AnswerResponse
  onNext: () => void
}

/**
 * Post-answer panel: correctness banner, the required general comment, and the
 * optional comment for the alternative the student chose.
 */
export function AnswerFeedback({ feedback, onNext }: AnswerFeedbackProps) {
  const correct = feedback.is_correct
  return (
    <div className="flex flex-col gap-4" data-testid="answer-feedback">
      <div
        className={`flex items-center gap-2 rounded-[var(--radius-sm)] px-4 py-3 font-semibold ${
          correct
            ? 'bg-[var(--teal-light)] text-[var(--teal-ink)]'
            : 'bg-[var(--danger-bg)] text-[var(--danger)]'
        }`}
      >
        {correct ? <Check size={18} /> : <X size={18} />}
        {correct ? 'Você acertou!' : 'Você errou'}
      </div>

      {feedback.general_comment && (
        <div className="rounded-[var(--radius-sm)] border border-[color:var(--line)] bg-white p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.04em] text-[var(--muted)]">
            Comentário
          </p>
          <p className="text-sm leading-relaxed text-[#384a44]">
            {feedback.general_comment}
          </p>
        </div>
      )}

      {feedback.selected_alternative_comment && (
        <div className="rounded-[var(--radius-sm)] border border-[color:var(--line)] bg-[#f6f4ef] p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.04em] text-[var(--muted)]">
            Sobre a sua resposta
          </p>
          <p className="text-sm leading-relaxed text-[#384a44]">
            {feedback.selected_alternative_comment}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={onNext}
        data-testid="next-question"
        className="rounded-[var(--radius-sm)] bg-[var(--teal)] px-4 py-[15px] font-semibold text-white transition hover:bg-[#0c5b47]"
      >
        Próxima questão
      </button>
    </div>
  )
}
