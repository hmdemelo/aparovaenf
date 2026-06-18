'use client'

import { useState, useEffect } from 'react'
import { Bookmark, Check, X, ZoomIn } from 'lucide-react'
import type { AnswerResponse, FeedQuestionDto } from './types'
import { RichText } from '@/lib/utils/markdown-renderer'
import { shortQuestionId } from '@/lib/utils/short-question-id'

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
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)

  useEffect(() => {
    if (!isLightboxOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isLightboxOpen])

  function altState(alternativeId: string): 'correct' | 'wrong' | 'idle' | 'chosen' {
    if (!answered) return selected === alternativeId ? 'chosen' : 'idle'
    if (alternativeId === feedback.correct_alternative_id) return 'correct'
    if (alternativeId === selected) return 'wrong'
    return 'idle'
  }

  const altClasses: Record<ReturnType<typeof altState>, string> = {
    idle:
      'border-[color:var(--line)] bg-white text-[var(--ink)] hover:border-[rgba(0,84,64,0.28)]',
    chosen:
      'border-[color:var(--teal)] bg-[var(--teal-light)] text-[var(--teal-ink)]',
    correct:
      'border-[color:var(--teal)] bg-[var(--teal-light)] text-[var(--teal-ink)]',
    wrong:
      'border-[color:var(--danger)] bg-[var(--danger-bg)] text-[var(--danger)]',
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--muted)]">
            {[question.subject?.name, question.board?.name]
              .filter(Boolean)
              .join(' · ') || 'Questão'}
            <span className="ml-1.5 font-mono font-medium text-[var(--hint)]">
              · ID {shortQuestionId(question.id)}
            </span>
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {question.subject && (
              <span className="rounded-full bg-[rgba(160,243,212,0.42)] px-3 py-1 font-semibold text-[var(--teal-ink)]">
                {question.subject.name}
              </span>
            )}
            <span className="rounded-full bg-white/70 px-3 py-1 font-semibold text-[var(--muted)] ring-1 ring-[color:var(--line)]">
              {DIFFICULTY_LABEL[question.difficulty]}
            </span>
            {question.board && (
              <span className="rounded-full bg-white/70 px-3 py-1 font-semibold text-[var(--muted)] ring-1 ring-[color:var(--line)]">
                {question.board.name}
              </span>
            )}
            {question.annulled && (
              <span className="rounded-full bg-[var(--warn-bg)] px-3 py-1 font-semibold text-[var(--warn)]">
                Questão anulada
              </span>
            )}
          </div>
        </div>
        {onToggleFavorite && (
          <button
            type="button"
            onClick={onToggleFavorite}
            aria-label="Favoritar questão"
            aria-pressed={favorited}
            data-testid="favorite-button"
            className="rounded-full p-2 text-[var(--teal)] transition hover:bg-[rgba(160,243,212,0.28)]"
          >
            <Bookmark
              size={22}
              className={favorited ? 'fill-[var(--teal)] text-[var(--teal)]' : ''}
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

      {/* Grid container if image is present */}
      <div className={question.image_path ? 'grid gap-6 md:grid-cols-2' : 'flex flex-col gap-5'}>
        {question.image_path && (
          <div className="flex flex-col gap-2">
            <div
              className="relative overflow-hidden rounded-[18px] border border-[color:var(--line)] bg-white p-2 cursor-zoom-in group transition hover:border-[var(--teal)]"
              onClick={() => setIsLightboxOpen(true)}
              data-testid="question-image-container"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/question-images/${question.image_path}`}
                alt="Imagem da questão"
                className="max-h-[220px] md:max-h-[380px] w-full object-contain rounded-[12px] transition group-hover:scale-[1.01]"
              />
              <div className="absolute bottom-3 right-3 rounded-full bg-black/60 p-1.5 text-white opacity-0 group-hover:opacity-100 transition duration-200">
                <ZoomIn size={16} />
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-5">
          <div className="font-display text-[21px] font-semibold leading-[1.25] text-[var(--ink)]">
            <RichText text={question.statement} />
          </div>

          <ul className="flex flex-col gap-3">
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
                    className={`group flex w-full items-start gap-4 rounded-[20px] border-[1.5px] px-4 py-4 text-left text-[15.5px] shadow-sm transition active:scale-[0.98] disabled:cursor-default disabled:active:scale-100 ${altClasses[state]}`}
                  >
                    <span
                      className={`aprova-option-letter ${
                        state === 'correct' || state === 'chosen'
                          ? 'border-[var(--teal)] bg-[rgba(160,243,212,0.38)] text-[var(--teal)]'
                          : state === 'wrong'
                            ? 'border-[var(--danger)] bg-[var(--danger-bg)] text-[var(--danger)]'
                            : 'text-[var(--muted)] group-hover:text-[var(--teal)]'
                      }`}
                    >
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
              className="mt-1 rounded-[18px] bg-[var(--teal)] px-4 py-[16px] font-semibold text-white shadow-[0_16px_30px_-22px_rgba(0,84,64,0.9)] transition hover:bg-[var(--teal-mid)] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[var(--hint)]"
            >
              {submitting ? 'Enviando...' : 'Responder'}
            </button>
          )}
        </div>
      </div>

      {isLightboxOpen && question.image_path && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4 transition-opacity duration-300 animate-fade-in"
          onClick={() => setIsLightboxOpen(false)}
          data-testid="image-lightbox"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition cursor-pointer"
            aria-label="Fechar zoom"
          >
            <X size={24} />
          </button>
          
          {/* Lightbox Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/question-images/${question.image_path}`}
            alt="Imagem ampliada da questão"
            className="max-h-[90vh] max-w-[95vw] object-contain rounded-lg shadow-2xl transition-transform duration-300 hover:scale-105"
            onClick={(e) => e.stopPropagation()}
          />
          <span className="mt-4 text-xs text-white/60 select-none">
            Pressione Esc ou clique fora para fechar.
          </span>
        </div>
      )}
    </div>
  )
}
