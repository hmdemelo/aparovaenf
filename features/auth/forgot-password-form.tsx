'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LoaderCircle, MailCheck } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/db/browser'
import { authEmailSchema } from '@/lib/validation/schemas'

/** Requests a password-reset email via Supabase. */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const parsedEmail = authEmailSchema.safeParse(email)
    if (!parsedEmail.success) {
      setError(parsedEmail.error.issues[0]?.message ?? 'Informe um e-mail válido.')
      setLoading(false)
      return
    }

    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.resetPasswordForEmail(parsedEmail.data, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    })
    if (error) {
      setError('Não foi possível enviar o e-mail. Tente novamente.')
      setLoading(false)
      return
    }
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-4 text-center" data-testid="forgot-sent">
        <MailCheck aria-hidden="true" className="h-10 w-10 text-[var(--teal)]" />
        <p className="text-sm text-[var(--muted)]">
          Se houver uma conta com <strong className="text-[var(--ink)]">{email}</strong>,
          você receberá um link para redefinir sua senha.
        </p>
        <Link
          href="/login"
          className="text-sm font-semibold text-[var(--teal)] underline"
        >
          Voltar para o login
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4" data-testid="forgot-password-form">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="forgot-email"
            className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--hint)]"
          >
            E-mail
          </label>
          <input
            id="forgot-email"
            type="email"
            required
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            data-testid="email"
            className="aprova-field"
          />
        </div>
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          data-testid="submit"
          className="aprova-button py-3.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading && <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />}
          {loading ? 'Enviando...' : 'Enviar link de recuperação'}
        </button>
      </form>
      <Link
        href="/login"
        className="text-center text-sm font-semibold text-[var(--teal)] underline"
      >
        Voltar para o login
      </Link>
    </div>
  )
}
