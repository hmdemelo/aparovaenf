'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, LoaderCircle } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/db/browser'
import { forcePasswordChangeInputSchema } from '@/lib/validation/schemas'

type Status = 'verifying' | 'ready' | 'invalid'

/** Sets a new password using the recovery session from the reset email link. */
export function ResetPasswordForm() {
  const router = useRouter()
  const [status, setStatus] = useState<Status>('verifying')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setStatus('ready')
      }
    })

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setStatus('ready')
    })

    const timeout = setTimeout(() => {
      setStatus((current) => (current === 'ready' ? current : 'invalid'))
    }, 4000)

    return () => {
      subscription.subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const parsed = forcePasswordChangeInputSchema.safeParse({ password })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Senha inválida.')
      setLoading(false)
      return
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.')
      setLoading(false)
      return
    }

    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
    if (error) {
      setError('Não foi possível atualizar a senha. O link pode ter expirado.')
      setLoading(false)
      return
    }
    setDone(true)
    setLoading(false)
    setTimeout(() => {
      router.push('/login')
      router.refresh()
    }, 2000)
  }

  if (status === 'verifying') {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-sm text-[var(--muted)]">
        <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
        Validando seu link...
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div className="flex flex-col items-center gap-4 text-center" data-testid="reset-invalid">
        <p className="text-sm text-[var(--muted)]">
          Este link de recuperação é inválido ou expirou.
        </p>
        <Link
          href="/recuperar-senha"
          className="text-sm font-semibold text-[var(--teal)] underline"
        >
          Solicitar novo link
        </Link>
      </div>
    )
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 text-center" data-testid="reset-done">
        <p className="text-sm text-[var(--muted)]">
          Senha atualizada! Redirecionando para o login...
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-3"
      data-testid="reset-password-form"
    >
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="reset-password"
          className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--hint)]"
        >
          Nova senha
        </label>
        <div className="relative">
          <input
            id="reset-password"
            type={showPassword ? 'text' : 'password'}
            required
            placeholder="Mínimo 8 caracteres"
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

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="reset-confirm"
          className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--hint)]"
        >
          Confirmar senha
        </label>
        <input
          id="reset-confirm"
          type={showPassword ? 'text' : 'password'}
          required
          placeholder="Repita a nova senha"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          data-testid="confirm-password"
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
        {loading ? 'Salvando...' : 'Salvar nova senha'}
      </button>
    </form>
  )
}
