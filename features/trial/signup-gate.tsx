'use client'

import Link from 'next/link'
import { UserPlus } from 'lucide-react'

/**
 * Shown when an unauthenticated visitor reaches the feed API. Invites the
 * visitor to create an account to unlock the 3 free questions.
 */
export function SignupGate({ careerSlug }: { careerSlug: string }) {
  const next = encodeURIComponent(`/feed?career=${careerSlug}`)
  return (
    <div
      className="aprova-study-card flex flex-col gap-4 p-6 text-center"
      data-testid="signup-gate"
    >
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(160,243,212,0.42)] text-[var(--teal)]">
        <UserPlus size={22} />
      </span>
      <h2 className="font-display text-[24px] font-semibold leading-tight text-[var(--ink)]">
        Crie sua conta para continuar
      </h2>
      <p className="text-sm leading-relaxed text-[var(--muted)]">
        Cadastre-se gratuitamente e ganhe 3 questões comentadas para começar a
        praticar.
      </p>
      <Link
        href={`/signup?next=${next}`}
        className="rounded-[18px] bg-[var(--teal)] px-4 py-3 font-semibold text-white transition hover:bg-[var(--teal-mid)] active:scale-[0.98]"
      >
        Criar conta gratuita
      </Link>
      <Link href={`/login?next=${next}`} className="text-sm font-semibold text-[var(--teal)] underline">
        Já tenho conta
      </Link>
    </div>
  )
}
