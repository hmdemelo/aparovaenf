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
        className={`flex items-center gap-2 rounded-xl px-4 py-3 font-semibold ${
          correct ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
        }`}
      >
        {correct ? <Check size={18} /> : <X size={18} />}
        {correct ? 'Você acertou!' : 'Você errou'}
      </div>

      {feedback.general_comment && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
            Comentário
          </p>
          <p className="text-sm leading-relaxed text-slate-700">
            {feedback.general_comment}
          </p>
        </div>
      )}

      {feedback.selected_alternative_comment && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
            Sobre a sua resposta
          </p>
          <p className="text-sm leading-relaxed text-slate-700">
            {feedback.selected_alternative_comment}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={onNext}
        data-testid="next-question"
        className="rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700"
      >
        Próxima questão
      </button>
    </div>
  )
}
