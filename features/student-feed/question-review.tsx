import Link from 'next/link'
import { Check, MessageCircle, RotateCcw, X } from 'lucide-react'
import { RichText } from '@/lib/utils/markdown-renderer'
import { shortQuestionId } from '@/lib/utils/short-question-id'
import type { QuestionReview } from './question-review-service'

const DIFFICULTY_LABEL: Record<string, string> = {
  facil: 'Fácil',
  media: 'Média',
  dificil: 'Difícil',
}

/**
 * Read-only question review: statement, alternatives with the correct one
 * highlighted (and the user's wrong pick, when there is one), plus the author
 * comments. Server-rendered; subscriber gating happens at the page level.
 */
export function QuestionReviewCard({ review }: { review: QuestionReview }) {
  return (
    <article
      className="aprova-study-card flex flex-col gap-5 p-6 sm:p-7"
      data-testid="question-review"
    >
      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--muted)]">
          Modo revisão
          <span className="ml-1.5 font-mono font-medium text-[var(--hint)]">
            · ID {shortQuestionId(review.id)}
          </span>
        </p>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {review.subject && (
            <span className="rounded-full bg-[rgba(160,243,212,0.42)] px-3 py-1 font-semibold text-[var(--teal-ink)]">
              {review.subject}
            </span>
          )}
          {review.difficulty && (
            <span className="rounded-full bg-white/70 px-3 py-1 font-semibold text-[var(--muted)] ring-1 ring-[color:var(--line)]">
              {DIFFICULTY_LABEL[review.difficulty] ?? review.difficulty}
            </span>
          )}
          {review.board && (
            <span className="rounded-full bg-white/70 px-3 py-1 font-semibold text-[var(--muted)] ring-1 ring-[color:var(--line)]">
              {review.board}
            </span>
          )}
        </div>
      </div>

      {review.imagePath && (
        <div className="overflow-hidden rounded-[18px] border border-[color:var(--line)] bg-white p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/question-images/${review.imagePath}`}
            alt="Imagem da questão"
            width={800}
            height={600}
            loading="lazy"
            className="h-[220px] md:h-[380px] w-full rounded-[12px] object-contain"
          />
        </div>
      )}

      <div className="font-display text-[21px] font-semibold leading-[1.25] text-[var(--ink)]">
        <RichText text={review.statement} />
      </div>

      <ul className="flex flex-col gap-3">
        {review.alternatives.map((alt) => {
          const isUserWrongPick =
            alt.id === review.lastSelectedAlternativeId && !alt.isCorrect
          const boxClasses = alt.isCorrect
            ? 'border-[color:var(--teal)] bg-[var(--teal-light)] text-[var(--teal-ink)]'
            : isUserWrongPick
              ? 'border-[color:var(--danger)] bg-[var(--danger-bg)] text-[var(--danger)]'
              : 'border-[color:var(--line)] bg-white text-[var(--ink)]'
          return (
            <li key={alt.id}>
              <div
                className={`flex w-full flex-col gap-2 rounded-[20px] border-[1.5px] px-4 py-4 text-left text-[15.5px] shadow-sm ${boxClasses}`}
                data-testid="review-alternative"
                data-correct={alt.isCorrect}
              >
                <div className="flex items-start gap-4">
                  <span className="aprova-option-letter">{alt.label}</span>
                  <span className="flex-1 leading-relaxed">{alt.text}</span>
                  {alt.isCorrect && (
                    <Check
                      size={18}
                      className="mt-0.5 shrink-0 text-[var(--teal)]"
                      aria-label="Alternativa correta"
                    />
                  )}
                  {isUserWrongPick && (
                    <X
                      size={18}
                      className="mt-0.5 shrink-0 text-[var(--danger)]"
                      aria-label="Sua resposta"
                    />
                  )}
                </div>
                {alt.comment && (
                  <p className="border-l-2 border-[var(--line)] pl-3 text-xs leading-relaxed text-[var(--muted)]">
                    <RichText text={alt.comment} />
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {review.generalComment && (
        <div className="rounded-[22px] border border-[color:var(--line)] bg-[rgba(203,222,215,0.32)] p-5">
          <div className="mb-3 flex items-center gap-2 text-[var(--teal)]">
            <MessageCircle size={19} />
            <p className="font-display text-[19px] font-semibold">
              Comentário do autor
            </p>
          </div>
          <p className="text-[15px] leading-relaxed text-[#384a44]">
            <RichText text={review.generalComment} />
          </p>
        </div>
      )}

      {review.careerSlug && (
        <Link
          href={`/feed?career=${review.careerSlug}&question=${review.id}`}
          data-testid="review-retry"
          className="flex items-center justify-center gap-2 rounded-[20px] bg-[var(--teal)] px-4 py-[17px] font-semibold text-white transition hover:bg-[var(--teal-mid)] active:scale-[0.98]"
        >
          <RotateCcw size={18} />
          Refazer questão
        </Link>
      )}
    </article>
  )
}
