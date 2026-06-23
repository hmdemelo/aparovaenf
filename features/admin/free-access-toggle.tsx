'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Gift, Loader2 } from 'lucide-react'

type Props = {
  userId: string
  freeAccess: boolean
}

export function FreeAccessToggle({ userId, freeAccess }: Props) {
  const router = useRouter()
  const [enabled, setEnabled] = useState(freeAccess)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function toggle() {
    const next = !enabled
    setPending(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ freeAccess: next }),
      })
      const payload = await response.json()
      if (!response.ok || !payload?.success) {
        setError(payload?.error?.message ?? 'Falha ao atualizar acesso.')
        return
      }
      setEnabled(next)
      router.refresh()
    } catch {
      setError('Falha ao atualizar acesso.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        data-testid={`free-access-toggle-${userId}`}
        aria-pressed={enabled}
        title={
          enabled
            ? 'Revogar acesso liberado'
            : 'Liberar acesso sem pagamento (teste)'
        }
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
          enabled
            ? 'bg-violet-100 text-violet-700 hover:bg-violet-200'
            : 'bg-[#f1efe9] text-[var(--muted)] hover:bg-[#e7e4dc]'
        }`}
      >
        {pending ? (
          <Loader2 size={13} className="animate-spin" aria-hidden="true" />
        ) : (
          <Gift size={13} aria-hidden="true" />
        )}
        {enabled ? 'Acesso liberado' : 'Liberar acesso'}
      </button>
      {error && <span className="text-[11px] text-red-600">{error}</span>}
    </div>
  )
}
