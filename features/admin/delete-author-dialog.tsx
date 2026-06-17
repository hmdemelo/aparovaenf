'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import type { AdminAuthorRow } from './admin-service'

type ApiError = { error?: { message?: string } }

type Mode = 'transfer' | 'delete'

const CONFIRM_WORD = 'DELETAR'

export function DeleteAuthorDialog({
  author,
  otherAuthors,
  onClose,
}: {
  author: AdminAuthorRow
  otherAuthors: AdminAuthorRow[]
  onClose: () => void
}) {
  const router = useRouter()
  const hasQuestions = author.questionCount > 0
  const [mode, setMode] = useState<Mode>(hasQuestions ? 'transfer' : 'delete')
  const [transferTo, setTransferTo] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const transferInvalid = mode === 'transfer' && hasQuestions && !transferTo
  const deleteInvalid =
    mode === 'delete' && hasQuestions && confirmText !== CONFIRM_WORD
  const submitDisabled = loading || transferInvalid || deleteInvalid

  async function onConfirm() {
    setLoading(true)
    setError(null)

    const payload =
      mode === 'transfer' && hasQuestions
        ? { transferToAuthorId: transferTo }
        : { deleteQuestions: hasQuestions }

    try {
      const response = await fetch(`/api/admin/authors/${author.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as ApiError
        setError(body.error?.message ?? 'Não foi possível deletar o autor.')
        setLoading(false)
        return
      }

      setLoading(false)
      router.refresh()
      onClose()
    } catch {
      setError('Erro de rede. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4" data-testid="delete-author-dialog">
      <p className="text-sm text-[var(--muted)]">
        Deletar <strong className="text-[var(--ink)]">{author.displayName}</strong>
        {author.email ? ` (${author.email})` : ''} remove o acesso e o perfil do
        autor. Esta ação é irreversível.
      </p>

      {hasQuestions ? (
        <>
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Este autor possui <strong>{author.questionCount}</strong>{' '}
            {author.questionCount === 1
              ? 'questão publicada'
              : 'questões publicadas'}
            . Escolha o que fazer com elas antes de deletar.
          </p>

          <div className="flex flex-col gap-2 text-sm">
            <label className="flex items-start gap-2">
              <input
                type="radio"
                name="author-delete-mode"
                checked={mode === 'transfer'}
                onChange={() => setMode('transfer')}
                className="mt-1 accent-[var(--teal)]"
                data-testid="author-mode-transfer"
              />
              <span>
                <span className="block font-semibold text-[var(--ink)]">
                  Reatribuir questões a outro autor
                </span>
                <span className="text-[var(--muted)]">
                  Preserva as questões e o histórico de respostas dos alunos.
                </span>
              </span>
            </label>

            {mode === 'transfer' && (
              <select
                value={transferTo}
                onChange={(event) => setTransferTo(event.target.value)}
                className="aprova-field ml-6"
                data-testid="author-transfer-target"
              >
                <option value="">Selecione o autor de destino...</option>
                {otherAuthors.map((other) => (
                  <option key={other.id} value={other.id}>
                    {other.displayName}
                  </option>
                ))}
              </select>
            )}

            <label className="flex items-start gap-2">
              <input
                type="radio"
                name="author-delete-mode"
                checked={mode === 'delete'}
                onChange={() => setMode('delete')}
                className="mt-1 accent-[var(--teal)]"
                data-testid="author-mode-delete"
              />
              <span>
                <span className="block font-semibold text-red-600">
                  Deletar também as questões e itens cadastrados
                </span>
                <span className="text-[var(--muted)]">
                  Remove as questões, alternativas, respostas e favoritos
                  vinculados. Afeta o histórico dos alunos.
                </span>
              </span>
            </label>

            {mode === 'delete' && (
              <label className="ml-6 flex flex-col gap-1 text-xs">
                <span className="text-[var(--muted)]">
                  Digite <strong>{CONFIRM_WORD}</strong> para confirmar a
                  exclusão das questões.
                </span>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(event) => setConfirmText(event.target.value)}
                  className="aprova-field"
                  data-testid="author-delete-confirm"
                  autoComplete="off"
                />
              </label>
            )}
          </div>
        </>
      ) : (
        <p className="rounded-lg bg-[var(--surface-paper)] px-3 py-2 text-xs text-[var(--muted)]">
          Este autor não possui questões cadastradas.
        </p>
      )}

      {error && (
        <p className="text-sm text-[var(--danger)]" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={onClose}
          className="rounded-lg px-3 py-2 text-sm font-semibold text-[var(--muted)] transition hover:bg-neutral-100"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={submitDisabled}
          onClick={onConfirm}
          className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
          data-testid="confirm-delete-author-btn"
        >
          <Trash2 size={15} />
          {loading ? 'Deletando...' : 'Deletar autor'}
        </button>
      </div>
    </div>
  )
}
