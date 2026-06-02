'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { BookOpen, Heart, History, UserCircle } from 'lucide-react'
import { QuestionCard } from './question-card'
import { AnswerFeedback } from './answer-feedback'
import { SignupGate } from '@/features/trial/signup-gate'
import { Paywall } from '@/features/billing/paywall'
import type { AnswerResponse, FeedNextResponse, FeedQuestionDto } from './types'

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } }

type Gate = 'none' | 'signup' | 'paywall'

/**
 * Orchestrates the trial learning loop: fetch question -> answer -> feedback ->
 * next, surfacing the signup gate or paywall when the trial limits are hit.
 *
 * Navigation: a "Próxima" button (desktop) plus vertical swipe (mobile/tablet),
 * both calling advance().
 */
export function FeedShell({
  careerSlug,
  boardSlug,
}: {
  careerSlug: string
  boardSlug?: string
}) {
  const [question, setQuestion] = useState<FeedQuestionDto | null>(null)
  const [feedback, setFeedback] = useState<AnswerResponse | null>(null)
  const [gate, setGate] = useState<Gate>('none')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [favorited, setFavorited] = useState(false)
  const [favoriteMsg, setFavoriteMsg] = useState<string | null>(null)
  const [subscriptionActive, setSubscriptionActive] = useState(false)

  const loadNext = useCallback(async () => {
    setLoading(true)
    setError(null)
    setFeedback(null)
    setFavorited(false)
    setFavoriteMsg(null)
    try {
      const params = new URLSearchParams({ career: careerSlug })
      if (boardSlug) params.set('board', boardSlug)
      const res = await fetch(`/api/feed/next?${params.toString()}`)
      const json: ApiEnvelope<FeedNextResponse> = await res.json()
      if (!json.success) {
        setError(json.error.message)
        return
      }
      const { question: q, trial_status } = json.data
      if (trial_status.signup_required) setGate('signup')
      else if (trial_status.paywall_required) setGate('paywall')
      else setGate('none')
      setSubscriptionActive(trial_status.subscription_active)
      setQuestion(q)
    } catch {
      setError('Não foi possível carregar a questão.')
    } finally {
      setLoading(false)
    }
  }, [careerSlug, boardSlug])

  useEffect(() => {
    // On-mount data fetch (no client cache library in the MVP); loadNext owns
    // its own loading/error state transitions.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadNext()
  }, [loadNext])

  async function submitAnswer(alternativeId: string) {
    if (!question) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: question.id,
          alternative_id: alternativeId,
        }),
      })
      const json: ApiEnvelope<AnswerResponse> = await res.json()
      if (!json.success) {
        if (json.error.code === 'signup_required') setGate('signup')
        else if (json.error.code === 'subscription_required') setGate('paywall')
        else setError(json.error.message)
        return
      }
      setFeedback(json.data)
      setSubscriptionActive(json.data.trial_status.subscription_active)
    } catch {
      setError('Não foi possível enviar a resposta.')
    } finally {
      setSubmitting(false)
    }
  }

  const advance = useCallback(() => {
    // After answering, the next fetch reflects the updated trial status and
    // will surface the gate if the limit was reached.
    void loadNext()
  }, [loadNext])

  async function toggleFavorite() {
    if (!question) return
    setFavoriteMsg(null)
    try {
      if (favorited) {
        await fetch(`/api/favorites/${question.id}`, { method: 'DELETE' })
        setFavorited(false)
        return
      }
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_id: question.id }),
      })
      const json: ApiEnvelope<{ saved: boolean }> = await res.json()
      if (json.success) {
        setFavorited(true)
        return
      }
      // Non-subscribers (and anonymous) cannot persist favorites.
      setFavoriteMsg(
        json.error.code === 'unauthenticated'
          ? 'Entre na sua conta para salvar favoritos.'
          : 'Assine para salvar favoritos.',
      )
    } catch {
      setFavoriteMsg('Não foi possível salvar o favorito.')
    }
  }

  // Vertical swipe-to-next on touch devices, active only after feedback shows.
  const touchStartY = useRef<number | null>(null)
  function onTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartY.current === null || !feedback) return
    const delta = touchStartY.current - e.changedTouches[0].clientY
    if (delta > 60) advance() // swipe up
    touchStartY.current = null
  }

  const feedParams = new URLSearchParams({ career: careerSlug })
  if (boardSlug) feedParams.set('board', boardSlug)
  const feedHref = `/feed?${feedParams.toString()}`

  return (
    <div
      className="mx-auto flex w-full max-w-[430px] flex-col gap-4 px-4 py-5 sm:py-8"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <header className="flex items-center justify-between px-1">
        <p className="aprova-wordmark text-[21px]">
          aprova<span className="text-[var(--teal)]">enf</span>
        </p>
        <span
          className={`aprova-pill ${subscriptionActive ? 'aprova-pill-pro' : ''}`}
        >
          {subscriptionActive ? 'PRO' : 'Trial'}
        </span>
      </header>

      {error && (
        <p className="rounded-[var(--radius-sm)] bg-[var(--danger-bg)] px-4 py-2 text-sm text-[var(--danger)]">
          {error}
        </p>
      )}

      {loading && (
        <p className="py-12 text-center text-sm text-[var(--muted)]">
          Carregando...
        </p>
      )}

      {!loading && gate === 'signup' && <SignupGate careerSlug={careerSlug} />}
      {!loading && gate === 'paywall' && <Paywall />}

      {!loading && gate === 'none' && question && (
        <article className="relative rounded-[var(--radius)] border border-[color:var(--line-2)] bg-white p-[22px] shadow-[0_10px_30px_-15px_rgba(20,43,38,0.15)]">
          <div className="mb-4 flex justify-end">
            <span className="aprova-timer" aria-label="Indicador de leitura">
              <span className="aprova-dot" aria-hidden="true" />
              leitura
            </span>
          </div>
          <QuestionCard
            key={question.id}
            question={question}
            feedback={feedback}
            submitting={submitting}
            onAnswer={submitAnswer}
            favorited={favorited}
            // Favoriting becomes available after the question is answered.
            onToggleFavorite={feedback ? toggleFavorite : undefined}
          />
          {favoriteMsg && (
            <p
              className="mt-3 rounded-[var(--radius-sm)] bg-[var(--warn-bg)] px-4 py-2 text-sm text-[var(--warn)]"
              data-testid="favorite-message"
            >
              {favoriteMsg}
            </p>
          )}
          {feedback && (
            <div className="mt-5">
              <AnswerFeedback feedback={feedback} onNext={advance} />
              <p className="mt-2 text-center text-xs text-[var(--hint)]">
                Deslize para cima para a próxima
              </p>
            </div>
          )}
        </article>
      )}

      {!loading && gate === 'none' && !question && (
        <p className="py-12 text-center text-sm text-[var(--muted)]">
          Não há mais questões disponíveis para esta configuração.
        </p>
      )}

      <nav className="grid grid-cols-4 border-t border-[color:var(--line)] bg-white text-[10.5px] font-medium text-[var(--muted)]">
        <Link
          href={feedHref}
          className="flex flex-col items-center gap-1 px-1 py-3 text-[var(--teal)]"
        >
          <BookOpen size={21} />
          Questões
        </Link>
        <Link
          href="/favorites"
          className="flex flex-col items-center gap-1 px-1 py-3 transition hover:text-[var(--teal)]"
        >
          <Heart size={21} />
          Favoritos
        </Link>
        <Link
          href="/errors"
          className="flex flex-col items-center gap-1 px-1 py-3 transition hover:text-[var(--teal)]"
        >
          <History size={21} />
          Erros
        </Link>
        <Link
          href="/login"
          className="flex flex-col items-center gap-1 px-1 py-3 transition hover:text-[var(--teal)]"
        >
          <UserCircle size={21} />
          Conta
        </Link>
      </nav>
    </div>
  )
}
