'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CareerOption } from './subject-service'

type ApiError = { error?: { message?: string } }

const FIELD_CLASS = 'aprova-field'

type CreateSubjectFormProps = {
  careers: CareerOption[]
}

/**
 * Admin form to register a subject under a career. Posts to /api/admin/subjects
 * and refreshes the server-rendered list on success.
 */
export function CreateSubjectForm({ careers }: CreateSubjectFormProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [careerId, setCareerId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const response = await fetch('/api/admin/subjects', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, career_id: careerId }),
    })

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as ApiError
      setError(body.error?.message ?? 'Não foi possível criar o assunto.')
      setLoading(false)
      return
    }

    setSuccess(`Assunto ${name} criado com sucesso.`)
    setName('')
    setCareerId('')
    setLoading(false)
    router.refresh()
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-3 rounded-[18px] border border-[color:var(--line)] bg-white/82 p-5"
      data-testid="create-subject-form"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          type="text"
          required
          placeholder="Nome do assunto"
          value={name}
          onChange={(e) => setName(e.target.value)}
          data-testid="subject-name"
          className={FIELD_CLASS}
        />
        <select
          required
          value={careerId}
          onChange={(e) => setCareerId(e.target.value)}
          data-testid="subject-career"
          className={FIELD_CLASS}
        >
          <option value="" disabled>
            Carreira relacionada
          </option>
          {careers.map((career) => (
            <option key={career.id} value={career.id}>
              {career.name}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      {success && <p className="text-sm text-[var(--teal)]">{success}</p>}

      <button
        type="submit"
        disabled={loading}
        data-testid="subject-submit"
        className="aprova-button py-3 disabled:bg-[var(--hint)]"
      >
        {loading ? 'Criando...' : 'Criar assunto'}
      </button>
    </form>
  )
}
