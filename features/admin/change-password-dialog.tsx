'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound } from 'lucide-react'

type ApiError = { error?: { message?: string } }

export function ChangePasswordDialog({
  userId,
  userEmail,
}: {
  userId: string
  userEmail: string
}) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/admin/users/change-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId, password }),
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as ApiError
        setError(body.error?.message ?? 'Não foi possível alterar a senha.')
        setLoading(false)
        return
      }

      setSuccess('Senha alterada com sucesso! O usuário deverá trocá-la no primeiro acesso.')
      setPassword('')
      setLoading(false)
      setTimeout(() => {
        setIsOpen(false)
        setSuccess(null)
        router.refresh()
      }, 2000)
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
        className="flex items-center gap-1.5 rounded-lg border border-[color:var(--line)] bg-white px-2.5 py-1 text-xs font-semibold text-[var(--ink)] shadow-xs transition hover:bg-neutral-50"
        data-testid={`change-password-btn-${userId}`}
      >
        <KeyRound size={13} className="text-[var(--muted)]" />
        Alterar Senha
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div
            className="w-full max-w-md rounded-2xl border border-[color:var(--line)] bg-[color:var(--bg)] p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            data-testid="change-password-dialog"
          >
            <div className="mb-4">
              <h3 className="text-lg font-bold text-[var(--ink)]">
                Alterar Senha do Usuário
              </h3>
              <p className="mt-1 text-xs text-[var(--muted)] truncate">
                Definir senha temporária para: <strong>{userEmail}</strong>
              </p>
            </div>

            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <div>
                <input
                  type="password"
                  required
                  minLength={8}
                  maxLength={72}
                  autoComplete="new-password"
                  placeholder="Nova senha temporária (mín. 8 caracteres)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="aprova-field w-full"
                  data-testid="temp-password-input"
                  autoFocus
                />
              </div>

              {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
              {success && <p className="text-xs text-[var(--teal)]">{success}</p>}

              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setIsOpen(false)
                    setPassword('')
                    setError(null)
                    setSuccess(null)
                  }}
                  className="rounded-lg px-3 py-2 text-xs font-semibold text-[var(--muted)] hover:bg-neutral-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || password.length < 8}
                  className="aprova-button py-2 px-4 text-xs disabled:bg-[var(--hint)]"
                  data-testid="confirm-change-password-btn"
                >
                  {loading ? 'Alterando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
