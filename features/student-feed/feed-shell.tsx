'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { BookOpen, Heart, History, SlidersHorizontal, UserCircle, X } from 'lucide-react'
import { AprovaenfLogo } from '@/features/brand/aprovaenf-logo'
import { QuestionCard } from './question-card'
import { AnswerFeedback } from './answer-feedback'
import { SignupGate } from '@/features/trial/signup-gate'
import { Paywall } from '@/features/billing/paywall'
import type { FeedFilterOptions } from './feed-filter-options'
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
  filterOptions,
}: {
  careerSlug: string
  boardSlug?: string
  filterOptions?: FeedFilterOptions
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

  // Feed filters (Subject + Board + Tags). Board is sent as a slug, subject and
  // tags as ids; an empty value means "no filter on that dimension".
  const [showFilters, setShowFilters] = useState(false)
  const [subjectId, setSubjectId] = useState('')
  const [boardFilterSlug, setBoardFilterSlug] = useState(boardSlug ?? '')
  const [tagIds, setTagIds] = useState<string[]>([])

  const loadNext = useCallback(async () => {
    setLoading(true)
    setError(null)
    setFeedback(null)
    setFavorited(false)
    setFavoriteMsg(null)
    try {
      const params = new URLSearchParams({ career: careerSlug })
      if (boardFilterSlug) params.set('board', boardFilterSlug)
      if (subjectId) params.set('subject', subjectId)
      if (tagIds.length > 0) params.set('tags', tagIds.join(','))
      const res = await fetch(`/api/feed/next?${params.toString()}`)
      const json: ApiEnvelope<FeedNextResponse> = await res.json()
      if (!json.success) {
        setError(json.error.message)
        return
      }
      const { question: q, trial_status } = json.data
      if (trial_status.signup_required) {
        setGate('signup')
      } else if (trial_status.paywall_required) {
        setGate('paywall')
        window.location.href = '/assinar'
        return
      } else {
        setGate('none')
      }
      setSubscriptionActive(trial_status.subscription_active)
      setQuestion(q)
    } catch {
      setError('Não foi possível carregar a questão.')
    } finally {
      setLoading(false)
    }
  }, [careerSlug, boardFilterSlug, subjectId, tagIds])

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
        if (json.error.code === 'signup_required') {
          setGate('signup')
        } else if (json.error.code === 'subscription_required') {
          setGate('paywall')
          window.location.href = '/assinar'
          return
        } else {
          setError(json.error.message)
        }
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
  if (boardFilterSlug) feedParams.set('board', boardFilterSlug)
  const feedHref = `/feed?${feedParams.toString()}`

  function toggleTag(id: string) {
    setTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    )
  }

  const activeFilterCount =
    (subjectId ? 1 : 0) + (boardFilterSlug ? 1 : 0) + tagIds.length
  const hasFilterOptions =
    !!filterOptions &&
    (filterOptions.subjects.length > 0 ||
      filterOptions.boards.length > 0 ||
      filterOptions.tags.length > 0)

  return (
    <div
      className="min-h-dvh pb-28"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <header className="aprova-appbar sticky top-0 z-40">
        <div className="mx-auto flex h-16 w-full max-w-[430px] items-center justify-between px-4">
          <Link href="/" aria-label="aprovaenf início">
            <AprovaenfLogo className="text-[var(--teal)]" />
          </Link>

          <nav className="hidden items-center gap-3.5 text-xs font-semibold text-[var(--muted)] md:flex">
            <Link href={feedHref} className="text-[var(--teal)]">
              Estudo
            </Link>
            <Link href="/favorites" className="transition hover:text-[var(--teal)]">
              Favoritos
            </Link>
            <Link href="/errors" className="transition hover:text-[var(--teal)]">
              Erros
            </Link>
            <Link href="/login" className="transition hover:text-[var(--teal)]">
              Conta
            </Link>
          </nav>

          <span
            className={`aprova-pill ${subscriptionActive ? 'aprova-pill-pro' : ''}`}
          >
            {subscriptionActive ? 'PRO' : 'Trial'}
          </span>
        </div>
        <div className="mx-auto h-1.5 w-full max-w-[430px] px-4">
          <div className="h-full overflow-hidden rounded-full bg-[var(--surface)]">
            <div className="h-full w-[42%] rounded-full bg-[var(--teal-mid)]" />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[430px] flex-col gap-4 px-4 py-6 sm:py-8">
        {hasFilterOptions && filterOptions && (
          <section data-testid="feed-filters">
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              aria-expanded={showFilters}
              data-testid="feed-filters-toggle"
              className="flex w-full items-center justify-between rounded-[var(--radius-sm)] bg-[var(--surface)] px-4 py-2.5 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--surface-hover,var(--surface))]"
            >
              <span className="flex items-center gap-2">
                <SlidersHorizontal size={16} />
                Filtros
                {activeFilterCount > 0 && (
                  <span className="aprova-pill aprova-pill-pro text-[11px]">
                    {activeFilterCount}
                  </span>
                )}
              </span>
              <span className="text-xs text-[var(--muted)]">
                {showFilters ? 'Fechar' : 'Abrir'}
              </span>
            </button>

            {showFilters && (
              <div className="mt-3 flex flex-col gap-4 rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--paper)] p-4">
                {filterOptions.subjects.length > 0 && (
                  <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                    Assunto
                    <select
                      value={subjectId}
                      onChange={(e) => setSubjectId(e.target.value)}
                      data-testid="filter-subject"
                      className="aprova-field text-sm font-normal text-[var(--ink)]"
                    >
                      <option value="">Todos</option>
                      {filterOptions.subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                {filterOptions.boards.length > 0 && (
                  <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                    Banca
                    <select
                      value={boardFilterSlug}
                      onChange={(e) => setBoardFilterSlug(e.target.value)}
                      data-testid="filter-board"
                      className="aprova-field text-sm font-normal text-[var(--ink)]"
                    >
                      <option value="">Todas</option>
                      {filterOptions.boards.map((b) => (
                        <option key={b.id} value={b.slug}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                {filterOptions.tags.length > 0 && (
                  <div className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                    Tags
                    <ul className="flex flex-wrap gap-2" data-testid="filter-tags">
                      {filterOptions.tags.map((t) => {
                        const active = tagIds.includes(t.id)
                        return (
                          <li key={t.id}>
                            <button
                              type="button"
                              onClick={() => toggleTag(t.id)}
                              aria-pressed={active}
                              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                                active
                                  ? 'bg-[var(--teal)] text-white'
                                  : 'bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-hover,var(--surface))]'
                              }`}
                            >
                              {t.name}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}

                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSubjectId('')
                      setBoardFilterSlug('')
                      setTagIds([])
                    }}
                    data-testid="filter-clear"
                    className="flex items-center gap-1 self-start text-xs font-semibold text-[var(--muted)] transition hover:text-[var(--danger)]"
                  >
                    <X size={14} />
                    Limpar filtros
                  </button>
                )}
              </div>
            )}
          </section>
        )}

        {error && (
          <p className="rounded-[var(--radius-sm)] bg-[var(--danger-bg)] px-4 py-2 text-sm text-[var(--danger)]">
            {error}
          </p>
        )}

        {loading && (
          <div className="aprova-study-card px-5 py-12 text-center">
            <span className="aprova-timer justify-center" aria-label="Carregando">
              <span className="aprova-dot" aria-hidden="true" />
              Carregando questão
            </span>
          </div>
        )}

        {!loading && gate === 'signup' && <SignupGate careerSlug={careerSlug} />}
        {!loading && gate === 'paywall' && <Paywall />}

        {!loading && gate === 'none' && question && (
          <article className="aprova-study-card relative p-6 sm:p-7">
            <div className="mb-5 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--muted)]">
                Questão ativa
              </span>
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
                className="mt-4 rounded-[var(--radius-sm)] bg-[var(--warn-bg)] px-4 py-2 text-sm text-[var(--warn)]"
                data-testid="favorite-message"
              >
                {favoriteMsg}
              </p>
            )}
            {feedback && (
              <div className="mt-6">
                <AnswerFeedback feedback={feedback} onNext={advance} />
                <p className="mt-3 text-center text-xs text-[var(--hint)]">
                  Deslize para cima para a próxima
                </p>
              </div>
            )}
          </article>
        )}

        {!loading && gate === 'none' && !question && (
          <p className="aprova-study-card px-5 py-12 text-center text-sm text-[var(--muted)]">
            Não há mais questões disponíveis para esta configuração.
          </p>
        )}
      </main>

      <nav className="aprova-bottom-nav fixed bottom-5 left-1/2 z-50 grid w-[min(92vw,420px)] -translate-x-1/2 grid-cols-4 p-2 md:hidden">
        <Link
          href={feedHref}
          className="aprova-nav-tab aprova-nav-tab-active"
        >
          <BookOpen size={21} />
          Estudo
        </Link>
        <Link
          href="/favorites"
          className="aprova-nav-tab"
        >
          <Heart size={21} />
          Favoritos
        </Link>
        <Link
          href="/errors"
          className="aprova-nav-tab"
        >
          <History size={21} />
          Erros
        </Link>
        <Link
          href="/login"
          className="aprova-nav-tab"
        >
          <UserCircle size={21} />
          Conta
        </Link>
      </nav>
    </div>
  )
}
