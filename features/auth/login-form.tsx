'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/db/browser'
import { fetchPostLoginDestination } from './post-login-destination'

/** Email/password sign-in. On success, navigates to `next` (default home). */
export function LoginForm({ next }: { next: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('E-mail ou senha inválidos.')
      setLoading(false)
      return
    }
    const destination = await fetchPostLoginDestination(next)
    router.push(destination)
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3" data-testid="login-form">
      <input
        type="email"
        required
        placeholder="E-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        data-testid="email"
        className="aprova-field"
      />
      <input
        type="password"
        required
        placeholder="Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        data-testid="password"
        className="aprova-field"
      />
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        data-testid="submit"
        className="aprova-button py-3.5 disabled:bg-[var(--hint)]"
      >
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
      <Link
        href={`/signup?next=${encodeURIComponent(next)}`}
        className="text-center text-sm font-semibold text-[var(--teal)] underline"
      >
        Criar conta
      </Link>
    </form>
  )
}
