'use client'

import { ArrowRight, Check, MessageCircle, X } from 'lucide-react'
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
        className={`flex items-center gap-2 rounded-[18px] px-4 py-3 font-semibold ${
          correct
            ? 'bg-[var(--teal-light)] text-[var(--teal-ink)]'
            : 'bg-[var(--danger-bg)] text-[var(--danger)]'
        }`}
      >
        {correct ? <Check size={18} /> : <X size={18} />}
        {correct ? 'Você acertou!' : 'Você errou'}
      </div>

      {feedback.general_comment && (
        <div className="rounded-[22px] border border-[color:var(--line)] bg-[rgba(203,222,215,0.32)] p-5">
          <div className="mb-3 flex items-center gap-2 text-[var(--teal)]">
            <MessageCircle size={19} />
            <p className="font-display text-[19px] font-semibold">
              Comentário do autor
            </p>
          </div>
          <p className="text-[15px] leading-relaxed text-[#384a44]">
            {feedback.general_comment}
          </p>
        </div>
      )}

      {feedback.selected_alternative_comment && (
        <div className="rounded-[18px] border border-[color:var(--line)] bg-white/72 p-4">
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
        className="flex items-center justify-center gap-2 rounded-[20px] bg-[var(--teal)] px-4 py-[17px] font-semibold text-white shadow-[0_18px_36px_-24px_rgba(0,84,64,0.92)] transition hover:bg-[var(--teal-mid)] active:scale-[0.98]"
      >
        Próxima questão
        <ArrowRight size={18} />
      </button>
    </div>
  )
}
