'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, KeyRound, LoaderCircle, Mail } from 'lucide-react'
import { GoogleAuthButton } from '@/components/google-auth-button'
import { createSupabaseBrowserClient } from '@/lib/db/browser'
import {
  authEmailSchema,
  buildAuthCallbackUrl,
} from '@/lib/validation/schemas'
import {
  authCallbackErrorMessage,
  authRequestErrorMessage,
} from './auth-messages'
import { fetchPostLoginDestination } from './post-login-destination'

/** Email/password sign-in. On success, navigates to `next` (default home). */
export function LoginForm({
  next,
  authError,
}: {
  next: string
  authError?: string
}) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(
    () => authCallbackErrorMessage(authError) ?? null,
  )
  const [notice, setNotice] = useState<string | null>(null)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [magicLoading, setMagicLoading] = useState(false)

  async function sendMagicLink() {
    setError(null)
    setNotice(null)

    const parsedEmail = authEmailSchema.safeParse(email)
    if (!parsedEmail.success) {
      setError(parsedEmail.error.issues[0]?.message ?? 'Informe um e-mail válido.')
      return
    }

    setMagicLoading(true)
    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: parsedEmail.data,
      options: {
        emailRedirectTo: buildAuthCallbackUrl(window.location.origin, next),
        shouldCreateUser: true,
      },
    })

    if (error) {
      setError(authRequestErrorMessage(error.message))
    } else {
      setNotice('Enviamos um link de acesso para seu e-mail.')
    }
    setMagicLoading(false)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPasswordLoading(true)
    setError(null)
    setNotice(null)

    const parsedEmail = authEmailSchema.safeParse(email)
    if (!parsedEmail.success) {
      setError(parsedEmail.error.issues[0]?.message ?? 'Informe um e-mail válido.')
      setPasswordLoading(false)
      return
    }

    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: parsedEmail.data,
      password,
    })
    if (error) {
      setError('E-mail ou senha inválidos.')
      setPasswordLoading(false)
      return
    }
    const destination = await fetchPostLoginDestination(next)
    router.push(destination)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-4" data-testid="login-form">
      <GoogleAuthButton next={next} onError={(message) => setError(message || null)} />

      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--hint)]">
        <span className="h-px flex-1 bg-[var(--line)]" />
        <span>ou</span>
        <span className="h-px flex-1 bg-[var(--line)]" />
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          required
          placeholder="E-mail"
          aria-label="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          data-testid="email"
          className="aprova-field"
        />

        <button
          type="button"
          disabled={magicLoading}
          onClick={sendMagicLink}
          data-testid="magic-link-submit"
          className="aprova-button py-3.5 disabled:cursor-not-allowed disabled:bg-[var(--hint)]"
        >
          {magicLoading ? (
            <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
          ) : (
            <Mail aria-hidden="true" className="h-4 w-4" />
          )}
          {magicLoading ? 'Enviando...' : 'Enviar link de acesso'}
        </button>

        <div className="mt-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--hint)]">
          <KeyRound aria-hidden="true" className="h-3.5 w-3.5" />
          <span>Senha</span>
        </div>

        <input
          type="password"
          required
          placeholder="Senha"
          aria-label="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          data-testid="password"
          className="aprova-field"
        />
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        {notice && (
          <p className="flex items-start gap-2 text-sm text-[var(--teal)]">
            <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{notice}</span>
          </p>
        )}
        <button
          type="submit"
          disabled={passwordLoading}
          data-testid="submit"
          className="aprova-button aprova-button-ghost py-3.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {passwordLoading ? (
            <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
          ) : (
            <KeyRound aria-hidden="true" className="h-4 w-4" />
          )}
          {passwordLoading ? 'Entrando...' : 'Entrar com senha'}
        </button>
      </form>
      <Link
        href={`/signup?next=${encodeURIComponent(next)}`}
        className="text-center text-sm font-semibold text-[var(--teal)] underline"
      >
        Criar conta
      </Link>
    </div>
  )
}
