'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, KeyRound, LoaderCircle } from 'lucide-react'
import { GoogleAuthButton } from '@/components/google-auth-button'
import { createSupabaseBrowserClient } from '@/lib/db/browser'
import { authEmailSchema } from '@/lib/validation/schemas'
import {
  authCallbackErrorMessage,
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
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPasswordLoading(true)
    setError(null)

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

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="login-email"
            className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--hint)]"
          >
            E-mail
          </label>
          <input
            id="login-email"
            type="email"
            required
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            data-testid="email"
            className="aprova-field"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="login-password"
              className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--hint)]"
            >
              Senha
            </label>
            <Link
              href="/recuperar-senha"
              className="text-xs font-semibold text-[var(--teal)] hover:underline"
            >
              Esqueceu a senha?
            </Link>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              data-testid="password"
              className="aprova-field pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-0 grid w-11 place-items-center text-[var(--hint)] transition-colors hover:text-[var(--ink)]"
            >
              {showPassword ? (
                <EyeOff aria-hidden="true" className="h-[18px] w-[18px]" />
              ) : (
                <Eye aria-hidden="true" className="h-[18px] w-[18px]" />
              )}
            </button>
          </div>
        </div>
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        <button
          type="submit"
          disabled={passwordLoading}
          data-testid="submit"
          className="aprova-button py-3.5 disabled:cursor-not-allowed disabled:opacity-60"
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
