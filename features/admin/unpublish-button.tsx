'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

/** Admin action: unpublish a question and refresh the dashboard. */
export function UnpublishButton({ questionId }: { questionId: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function onClick() {
    setBusy(true)
    await fetch(`/api/admin/questions/${questionId}/unpublish`, { method: 'POST' })
    setBusy(false)
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      data-testid={`unpublish-${questionId}`}
      className="rounded-lg border border-[color:var(--line)] px-3 py-1 text-xs font-medium text-[var(--danger)] transition hover:border-[color:var(--danger)] hover:bg-[var(--danger-bg)] disabled:opacity-50"
    >
      {busy ? 'Despublicando...' : 'Despublicar'}
    </button>
  )
}
