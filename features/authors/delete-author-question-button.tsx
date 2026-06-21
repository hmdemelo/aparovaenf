'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Trash2 } from 'lucide-react'

export function DeleteAuthorQuestionButton({
  questionId,
}: {
  questionId: string
}) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setDeleting(true)
    setError(null)
    try {
      const response = await fetch(`/api/author/questions/${questionId}`, {
        method: 'DELETE',
      })
      const json = await response.json()
      if (!response.ok || !json.success) {
        throw new Error(json.error?.message ?? 'Não foi possível apagar a questão.')
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao apagar questão.')
      setDeleting(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center justify-end gap-2">
        <span className="text-xs text-[var(--muted)]">Confirmar?</span>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          data-testid={`confirm-delete-${questionId}`}
          className="inline-flex items-center gap-1 rounded-full bg-[var(--danger-bg)] px-3 py-1 text-xs font-semibold text-[var(--danger)] transition hover:opacity-90 disabled:opacity-50"
        >
          {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
          Apagar
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={deleting}
          className="rounded-full border border-[color:var(--line-2)] px-3 py-1 text-xs font-semibold text-[var(--muted)] transition hover:bg-[var(--surface-paper)] disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => setConfirming(true)}
        data-testid={`delete-author-question-${questionId}`}
        className="inline-flex items-center gap-1 rounded-full border border-[color:var(--line-2)] px-3 py-1 text-xs font-semibold text-[var(--danger)] transition hover:border-[color:var(--danger)] hover:bg-[var(--danger-bg)]"
      >
        <Trash2 size={13} />
        Deletar
      </button>
      {error && <span className="text-[11px] text-[var(--danger)]">{error}</span>}
    </div>
  )
}
