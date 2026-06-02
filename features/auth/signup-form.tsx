'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/db/browser'

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
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createSupabaseBrowserClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    // If confirmation is required there is no active session yet.
    if (!data.session) {
      setError('Confirme seu e-mail para continuar.')
      setLoading(false)
      return
    }
    router.push(next)
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3" data-testid="signup-form">
      <input
        type="text"
        required
        placeholder="Nome"
        value={name}
        onChange={(e) => setName(e.target.value)}
        data-testid="name"
        className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
      />
      <input
        type="email"
        required
        placeholder="E-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        data-testid="email"
        className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
      />
      <input
        type="password"
        required
        minLength={6}
        placeholder="Senha (mín. 6 caracteres)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        data-testid="password"
        className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
      />
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        data-testid="submit"
        className="rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:bg-slate-300"
      >
        {loading ? 'Criando...' : 'Criar conta gratuita'}
      </button>
      <Link
        href={`/login?next=${encodeURIComponent(next)}`}
        className="text-center text-sm text-emerald-700 underline"
      >
        Já tenho conta
      </Link>
    </form>
  )
}
