'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, KeyRound, LoaderCircle } from 'lucide-react'
import { fetchPostLoginDestination } from './post-login-destination'

export function ForcePasswordForm({ next }: { next: string }) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/force-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const body = await response.json().catch(() => null)
      if (!response.ok || !body?.success) {
        setError(
          body?.error?.message ??
            'Não foi possível atualizar a senha. Tente novamente.',
        )
        setLoading(false)
        return
      }

      setSuccess(true)

      const destination = await fetchPostLoginDestination(next)
      router.push(destination)
      router.refresh()
    } catch {
      setError('Ocorreu um erro inesperado. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4" data-testid="force-password-form">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--hint)] flex items-center gap-1.5">
            <KeyRound aria-hidden="true" className="h-3.5 w-3.5" />
            Nova Senha Definitiva
          </label>
          <input
            type="password"
            required
            minLength={8}
            maxLength={72}
            placeholder="Mínimo de 8 caracteres"
            aria-label="Nova Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            data-testid="password"
            className="aprova-field mt-1"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--hint)] flex items-center gap-1.5">
            <KeyRound aria-hidden="true" className="h-3.5 w-3.5" />
            Confirmar Nova Senha
          </label>
          <input
            type="password"
            required
            minLength={8}
            maxLength={72}
            placeholder="Repita a senha digitada"
            aria-label="Confirmar Senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            data-testid="confirm-password"
            className="aprova-field mt-1"
          />
        </div>

        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        {success && (
          <p className="flex items-start gap-2 text-sm text-[var(--teal)]">
            <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Senha atualizada! Redirecionando...</span>
          </p>
        )}

        <button
          type="submit"
          disabled={loading || success}
          data-testid="submit"
          className="aprova-button py-3.5 mt-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
          ) : (
            <KeyRound aria-hidden="true" className="h-4 w-4" />
          )}
          {loading ? 'Salvando...' : 'Salvar Senha'}
        </button>
      </form>
    </div>
  )
}
