'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'
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
    idle: 'border-slate-200 bg-white hover:border-emerald-400',
    chosen: 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200',
    correct: 'border-emerald-500 bg-emerald-50',
    wrong: 'border-rose-400 bg-rose-50',
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {question.subject && (
          <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-700">
            {question.subject.name}
          </span>
        )}
        <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">
          {DIFFICULTY_LABEL[question.difficulty]}
        </span>
        {question.board && (
          <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">
            {question.board.name}
          </span>
        )}
        {question.annulled && (
          <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-700">
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
            className="ml-auto text-slate-300 transition hover:text-rose-500"
          >
            <Heart
              size={20}
              className={favorited ? 'fill-rose-500 text-rose-500' : ''}
            />
          </button>
        )}
      </div>

      {question.source && (
        <p className="text-xs text-slate-600">
          {[
            question.source.orgao,
            question.source.cargo,
            question.source.year?.toString(),
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      )}

      <p className="text-base leading-relaxed text-slate-800">
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
                className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition disabled:cursor-default ${altClasses[state]}`}
              >
                <span className="font-semibold text-slate-500">{alt.label}</span>
                <span className="text-slate-700">{alt.text}</span>
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
          className="mt-2 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {submitting ? 'Enviando...' : 'Responder'}
        </button>
      )}
    </div>
  )
}
