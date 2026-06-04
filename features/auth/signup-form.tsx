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
import { authRequestErrorMessage } from './auth-messages'
import { fetchPostLoginDestination } from './post-login-destination'

type SignupIdentityValidation =
  | { ok: true; email: string; name: string }
  | { ok: false; error: string }

/**
 * Email/password sign-up for students. After signup the handle_new_user trigger
 * creates the profile; with email confirmation disabled locally the session is
 * active immediately and we continue to `next`.
 */
export function SignupForm({ next }: { next: string }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [magicLoading, setMagicLoading] = useState(false)

  function validateSignupIdentity(): SignupIdentityValidation {
    const trimmedName = name.trim()
    if (!trimmedName) {
      return { ok: false, error: 'Informe seu nome para criar a conta.' }
    }

    const parsedEmail = authEmailSchema.safeParse(email)
    if (!parsedEmail.success) {
      return {
        ok: false,
        error: parsedEmail.error.issues[0]?.message ?? 'Informe um e-mail válido.',
      }
    }

    return { ok: true, name: trimmedName, email: parsedEmail.data }
  }

  async function sendMagicLink() {
    setError(null)
    setNotice(null)

    const identity = validateSignupIdentity()
    if (!identity.ok) {
      setError(identity.error)
      return
    }

    setMagicLoading(true)
    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: identity.email,
      options: {
        data: { name: identity.name },
        emailRedirectTo: buildAuthCallbackUrl(window.location.origin, next),
        shouldCreateUser: true,
      },
    })

    if (error) {
      setError(authRequestErrorMessage(error.message))
    } else {
      setNotice('Enviamos um link de acesso para concluir sua conta.')
    }
    setMagicLoading(false)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPasswordLoading(true)
    setError(null)
    setNotice(null)

    const identity = validateSignupIdentity()
    if (!identity.ok) {
      setError(identity.error)
      setPasswordLoading(false)
      return
    }

    const supabase = createSupabaseBrowserClient()
    const { data, error } = await supabase.auth.signUp({
      email: identity.email,
      password,
      options: {
        data: { name: identity.name },
        emailRedirectTo: buildAuthCallbackUrl(window.location.origin, next),
      },
    })
    if (error) {
      setError(error.message)
      setPasswordLoading(false)
      return
    }
    // If confirmation is required there is no active session yet.
    if (!data.session) {
      setNotice('Confirme seu e-mail para continuar.')
      setPasswordLoading(false)
      return
    }
    const destination = await fetchPostLoginDestination(next)
    router.push(destination)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-4" data-testid="signup-form">
      <GoogleAuthButton
        next={next}
        label="Criar conta com Google"
        onError={(message) => setError(message || null)}
      />

      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--hint)]">
        <span className="h-px flex-1 bg-[var(--line)]" />
        <span>ou</span>
        <span className="h-px flex-1 bg-[var(--line)]" />
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          required
          placeholder="Nome"
          aria-label="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          data-testid="name"
          className="aprova-field"
        />
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
          minLength={6}
          placeholder="Senha (mín. 6 caracteres)"
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
          {passwordLoading ? 'Criando...' : 'Criar com senha'}
        </button>
      </form>
      <Link
        href={`/login?next=${encodeURIComponent(next)}`}
        className="text-center text-sm font-semibold text-[var(--teal)] underline"
      >
        Já tenho conta
      </Link>
    </div>
  )
}
