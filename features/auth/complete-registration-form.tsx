'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, KeyRound, LoaderCircle } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/db/browser'
import { authRequestErrorMessage } from './auth-messages'
import { fetchPostLoginDestination } from './post-login-destination'

export function CompleteRegistrationForm({ next }: { next: string }) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)
    const supabase = createSupabaseBrowserClient()

    try {
      // 1. Update the Supabase Auth user password
      const { error: authError } = await supabase.auth.updateUser({
        password: password,
      })

      if (authError) {
        console.error('AUTH UPDATE USER FAILED:', authError)
        setError(authRequestErrorMessage(authError.message))
        setLoading(false)
        return
      }

      // 2. Get the current authenticated user's ID
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Sessão expirada. Faça login novamente.')
        setLoading(false)
        return
      }

      // 3. Mark the user profile as completed
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ registration_completed: true })
        .eq('id', user.id)

      if (profileError) {
        setError('Erro ao concluir o cadastro. Tente novamente.')
        setLoading(false)
        return
      }

      setSuccess(true)
      
      // 4. Resolve correct post-login destination and redirect
      const destination = await fetchPostLoginDestination(next)
      router.push(destination)
      router.refresh()
    } catch {
      setError('Ocorreu um erro inesperado. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4" data-testid="complete-registration-form">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--hint)] flex items-center gap-1.5">
            <KeyRound aria-hidden="true" className="h-3.5 w-3.5" />
            Nova Senha
          </label>
          <input
            type="password"
            required
            minLength={6}
            placeholder="Mínimo de 6 caracteres"
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
            Confirmar Senha
          </label>
          <input
            type="password"
            required
            minLength={6}
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
            <span>Cadastro concluído! Redirecionando...</span>
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
          {loading ? 'Salvando...' : 'Concluir e Começar'}
        </button>
      </form>
    </div>
  )
}
