'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

type ApiError = { error?: { message?: string } }

export function DeleteUserDialog({
  userId,
  userEmail,
}: {
  userId: string
  userEmail: string
}) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function close() {
    setIsOpen(false)
    setError(null)
  }

  async function onConfirm() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as ApiError
        setError(body.error?.message ?? 'Não foi possível deletar o usuário.')
        setLoading(false)
        return
      }

      setLoading(false)
      setIsOpen(false)
      router.refresh()
    } catch {
      setError('Erro de rede. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-2.5 py-1 text-xs font-semibold text-red-600 shadow-xs transition hover:bg-red-50"
        data-testid={`delete-user-btn-${userId}`}
      >
        <Trash2 size={13} />
        Deletar
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div
            className="w-full max-w-md rounded-2xl border border-[color:var(--line)] bg-[color:var(--bg)] p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            data-testid="delete-user-dialog"
          >
            <div className="mb-4">
              <h3 className="text-lg font-bold text-[var(--ink)]">
                Deletar usuário
              </h3>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Esta ação é irreversível. Serão removidos o acesso, o histórico
                de respostas, os favoritos e os registros de assinatura de{' '}
                <strong className="break-all">{userEmail}</strong>.
              </p>
            </div>

            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Usuários com assinatura ativa no Asaas não podem ser deletados
              aqui. Cancele a assinatura no Asaas primeiro.
            </p>

            {error && (
              <p className="mt-3 text-xs text-[var(--danger)]" role="alert">
                {error}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={close}
                className="rounded-lg px-3 py-2 text-xs font-semibold text-[var(--muted)] transition hover:bg-neutral-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={onConfirm}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                data-testid="confirm-delete-user-btn"
              >
                {loading ? 'Deletando...' : 'Deletar usuário'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
