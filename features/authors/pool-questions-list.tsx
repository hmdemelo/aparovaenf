'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, ClipboardList, Loader2, PenLine } from 'lucide-react'
import { shortQuestionId } from '@/lib/utils/short-question-id'

type PoolQuestion = {
  id: string
  statement: string
  status: string
  difficulty: string | null
  created_at: string
  published_at: string | null
  subject: { name: string } | null
}

export function PoolQuestionsList({
  initialQuestions,
}: {
  initialQuestions: PoolQuestion[]
}) {
  const router = useRouter()
  const [questions, setQuestions] = useState<PoolQuestion[]>(initialQuestions)
  const [claimingId, setClaimingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleClaim(questionId: string) {
    if (claimingId) return
    setClaimingId(questionId)
    setError(null)

    try {
      const response = await fetch(`/api/author/questions/${questionId}/claim`, {
        method: 'POST',
      })
      const json = await response.json()

      if (!response.ok || !json.success) {
        throw new Error(json.error?.message ?? 'Não foi possível reivindicar a questão.')
      }

      // Claim successful, redirect to edit page
      router.push(`/author/questions/${questionId}/edit`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao reivindicar questão.')
      setClaimingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="rounded-[var(--radius-sm)] bg-[var(--danger-bg)] px-4 py-2 text-sm text-[var(--danger)]">
          {error}
        </div>
      )}

      {questions.length === 0 ? (
        <div className="rounded-[var(--radius-sm)] border border-dashed border-[color:var(--line-2)] p-12 text-center text-[var(--muted)] flex flex-col items-center justify-center gap-3 bg-[var(--surface-paper)]/30">
          <ClipboardList size={36} className="text-[var(--muted)] opacity-60" />
          <div>
            <p className="font-semibold text-[var(--ink)] text-base">O pool está vazio</p>
            <p className="text-sm mt-1">
              Todas as questões importadas já foram reivindicadas ou publicadas!
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="aprova-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Enunciado</th>
                <th>Assunto</th>
                <th className="w-[180px] text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q) => {
                const isClaiming = claimingId === q.id
                const isAnyClaiming = claimingId !== null

                return (
                  <tr key={q.id}>
                    <td className="whitespace-nowrap font-mono text-xs text-[var(--muted)]">
                      {shortQuestionId(q.id)}
                    </td>
                    <td className="min-w-72 max-w-[500px]">
                      <div className="line-clamp-2 text-sm text-[var(--ink)]">
                        {q.statement}
                      </div>
                    </td>
                    <td className="text-[var(--muted)] text-sm">
                      {q.subject?.name ?? 'Sem assunto'}
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/author/questions/${q.id}/edit`}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--line-2)] px-3 py-1 text-xs font-semibold text-[var(--teal)] transition hover:bg-[rgba(160,243,212,0.2)] disabled:opacity-50"
                          title="Visualizar ou editar rascunho compartilhado"
                        >
                          <PenLine size={13} />
                          Editar
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleClaim(q.id)}
                          disabled={isAnyClaiming}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[var(--teal-light)] text-[var(--teal-ink)] border border-transparent px-3 py-1 text-xs font-bold transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Reivindicar para sua conta"
                        >
                          {isClaiming ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Check size={13} />
                          )}
                          Reivindicar
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
