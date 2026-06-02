'use client'

import { useState } from 'react'
import { Check, Heart, X } from 'lucide-react'
import type { AnswerResponse, FeedQuestionDto } from './types'

const DIFFICULTY_LABEL: Record<FeedQuestionDto['difficulty'], string> = {
  facil: 'Fácil',
  media: 'Média',
  dificil: 'Difícil',
}

type QuestionCardProps = {
  question: FeedQuestionDto
  feedback: AnswerResponse | null
  submitting: boolean
  onAnswer: (alternativeId: string) => void
  // Favorite affordance (only wired once the question has been answered).
  favorited?: boolean
  onToggleFavorite?: () => void
}

/**
 * Mobile-first question card: classification, statement, and selectable
 * alternatives. After an answer, alternatives become read-only and the correct
 * / selected ones are highlighted.
 */
export function QuestionCard({
  question,
  feedback,
  submitting,
  onAnswer,
  favorited,
  onToggleFavorite,
}: QuestionCardProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const answered = feedback !== null

  function altState(alternativeId: string): 'correct' | 'wrong' | 'idle' | 'chosen' {
    if (!answered) return selected === alternativeId ? 'chosen' : 'idle'
    if (alternativeId === feedback.correct_alternative_id) return 'correct'
    if (alternativeId === selected) return 'wrong'
    return 'idle'
  }

  const altClasses: Record<ReturnType<typeof altState>, string> = {
    idle:
      'border-[color:var(--line)] bg-white text-[var(--ink)] hover:border-[color:var(--line-2)]',
    chosen:
      'border-[color:var(--teal)] bg-[var(--teal-light)] text-[var(--teal-ink)]',
    correct:
      'border-[color:var(--teal)] bg-[var(--teal-light)] text-[var(--teal-ink)]',
    wrong:
      'border-[color:var(--danger)] bg-[var(--danger-bg)] text-[var(--danger)]',
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {question.subject && (
          <span className="rounded-full bg-[var(--teal-light)] px-3 py-1 font-medium text-[var(--teal-ink)]">
            {question.subject.name}
          </span>
        )}
        <span className="rounded-full bg-[#f1efe9] px-3 py-1 font-medium text-[var(--muted)]">
          {DIFFICULTY_LABEL[question.difficulty]}
        </span>
        {question.board && (
          <span className="rounded-full bg-[#f1efe9] px-3 py-1 font-medium text-[var(--muted)]">
            {question.board.name}
          </span>
        )}
        {question.annulled && (
          <span className="rounded-full bg-[var(--warn-bg)] px-3 py-1 font-medium text-[var(--warn)]">
            Questão anulada
          </span>
        )}
        {onToggleFavorite && (
          <button
            type="button"
            onClick={onToggleFavorite}
            aria-label="Favoritar questão"
            aria-pressed={favorited}
            data-testid="favorite-button"
            className="ml-auto text-[var(--hint)] transition hover:text-[var(--danger)]"
          >
            <Heart
              size={20}
              className={favorited ? 'fill-[var(--danger)] text-[var(--danger)]' : ''}
            />
          </button>
        )}
      </div>

      {question.source && (
        <p className="text-xs text-[var(--muted)]">
          {[
            question.source.orgao,
            question.source.cargo,
            question.source.year?.toString(),
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      )}

      <p className="text-[16.5px] leading-[1.55] text-[var(--ink)]">
        {question.statement}
      </p>

      <ul className="flex flex-col gap-2">
        {question.alternatives.map((alt) => {
          const state = altState(alt.id)
          return (
            <li key={alt.id}>
              <button
                type="button"
                data-testid="alternative"
                disabled={answered || submitting}
                aria-pressed={selected === alt.id}
                onClick={() => setSelected(alt.id)}
                className={`flex w-full items-start gap-3 rounded-[var(--radius-sm)] border-[1.5px] px-[15px] py-[14px] text-left text-[15px] transition disabled:cursor-default ${altClasses[state]}`}
              >
                <span className="min-w-5 font-semibold text-[var(--hint)]">
                  {alt.label}
                </span>
                <span className="flex-1 leading-relaxed">{alt.text}</span>
                {state === 'correct' && (
                  <Check size={18} className="mt-0.5 shrink-0 text-[var(--teal)]" />
                )}
                {state === 'wrong' && (
                  <X size={18} className="mt-0.5 shrink-0 text-[var(--danger)]" />
                )}
              </button>
            </li>
          )
        })}
      </ul>

      {!answered && (
        <button
          type="button"
          disabled={!selected || submitting}
          onClick={() => selected && onAnswer(selected)}
          className="mt-2 rounded-[var(--radius-sm)] bg-[var(--teal)] px-4 py-[15px] font-semibold text-white transition hover:bg-[#0c5b47] disabled:cursor-not-allowed disabled:bg-[var(--hint)]"
        >
          {submitting ? 'Enviando...' : 'Responder'}
        </button>
      )}
    </div>
  )
}
