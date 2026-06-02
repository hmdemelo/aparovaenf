'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type ApiError = { error?: { message?: string } }

const FIELD_CLASS = 'rounded-xl border border-slate-200 px-4 py-3 text-sm'

/**
 * Admin form to provision a new author. Posts to /api/admin/authors and refreshes
 * the server-rendered list on success so the new author appears immediately.
 */
export function CreateAuthorForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [shortBio, setShortBio] = useState('')
  const [instagram, setInstagram] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function reset() {
    setEmail('')
    setPassword('')
    setName('')
    setDisplayName('')
    setShortBio('')
    setInstagram('')
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const response = await fetch('/api/admin/authors', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        name,
        display_name: displayName,
        short_bio: shortBio || null,
        instagram: instagram || null,
      }),
    })

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as ApiError
      setError(body.error?.message ?? 'Não foi possível criar o autor.')
      setLoading(false)
      return
    }

    setSuccess(`Autor ${displayName} criado com sucesso.`)
    reset()
    setLoading(false)
    router.refresh()
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5"
      data-testid="create-author-form"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          type="text"
          required
          placeholder="Nome completo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          data-testid="author-name"
          className={FIELD_CLASS}
        />
        <input
          type="text"
          required
          placeholder="Nome de exibição (aparece nas questões)"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          data-testid="author-display-name"
          className={FIELD_CLASS}
        />
        <input
          type="email"
          required
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          data-testid="author-email"
          className={FIELD_CLASS}
        />
        <input
          type="text"
          required
          minLength={8}
          placeholder="Senha temporária (mín. 8 caracteres)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          data-testid="author-password"
          className={FIELD_CLASS}
        />
        <input
          type="text"
          placeholder="Instagram (opcional)"
          value={instagram}
          onChange={(e) => setInstagram(e.target.value)}
          data-testid="author-instagram"
          className={FIELD_CLASS}
        />
      </div>
      <textarea
        placeholder="Bio curta (opcional)"
        value={shortBio}
        onChange={(e) => setShortBio(e.target.value)}
        maxLength={280}
        rows={2}
        data-testid="author-bio"
        className={FIELD_CLASS}
      />

      {error && <p className="text-sm text-rose-600">{error}</p>}
      {success && <p className="text-sm text-emerald-700">{success}</p>}

      <button
        type="submit"
        disabled={loading}
        data-testid="author-submit"
        className="rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:bg-slate-300"
      >
        {loading ? 'Criando...' : 'Criar autor'}
      </button>
    </form>
  )
}
