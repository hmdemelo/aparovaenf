'use client'

import Link from 'next/link'

/**
 * Shown after the 2 free anonymous answers. Invites the visitor to create an
 * account to unlock 3 more free questions.
 */
export function SignupGate({ careerSlug }: { careerSlug: string }) {
  const next = encodeURIComponent(`/feed?career=${careerSlug}`)
  return (
    <div
      className="flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center"
      data-testid="signup-gate"
    >
      <h2 className="text-lg font-bold text-emerald-900">
        Crie sua conta para continuar
      </h2>
      <p className="text-sm text-emerald-800">
        Você respondeu suas 2 questões gratuitas. Cadastre-se e ganhe mais 3
        questões para continuar praticando.
      </p>
      <Link
        href={`/signup?next=${next}`}
        className="rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700"
      >
        Criar conta gratuita
      </Link>
      <Link href={`/login?next=${next}`} className="text-sm text-emerald-700 underline">
        Já tenho conta
      </Link>
    </div>
  )
}
