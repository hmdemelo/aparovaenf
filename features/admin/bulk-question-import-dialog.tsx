'use client'

import { useState } from 'react'
import { FileUp } from 'lucide-react'

type ImportAuthor = {
  id: string
  displayName: string
}

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } }

type ImportError = {
  line: number
  field: string
  message: string
}

type ImportResult = {
  author_id: string
  file_name: string
  total_rows: number
  imported: number
  failed: number
  created_question_ids: string[]
  errors: ImportError[]
}

export function BulkQuestionImportDialog({
  author,
  onClose,
  onImported,
}: {
  author: ImportAuthor
  onClose: () => void
  onImported: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!file) return

    setSubmitting(true)
    setError(null)
    setResult(null)

    const formData = new FormData()
    formData.set('file', file)

    try {
      const response = await fetch(
        `/api/admin/authors/${author.id}/questions/bulk-import`,
        {
          method: 'POST',
          body: formData,
        },
      )
      const json: ApiEnvelope<ImportResult> = await response.json()
      if (!json.success) {
        setError(json.error.message)
        return
      }

      setResult(json.data)
      if (json.data.imported > 0) onImported()
    } catch {
      setError('Nao foi possivel importar o arquivo.')
    } finally {
      setSubmitting(false)
    }
  }

  const visibleErrors = result?.errors.slice(0, 50) ?? []

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-4"
      data-testid="bulk-import-form"
    >
      <div className="rounded-[18px] border border-[color:var(--line)] bg-[var(--surface-paper)] px-4 py-3 text-sm text-[var(--muted)]">
        <p className="font-semibold text-[var(--ink)]">
          Importar questões para {author.displayName}
        </p>
        <p className="mt-1">
          CSV UTF-8, separado por ponto e vírgula, até 5 MB e 500 linhas.
        </p>
        <a
          href="/api/admin/questions/bulk-template"
          download
          className="mt-2 inline-flex font-semibold text-[var(--teal)] hover:underline"
        >
          Baixar template
        </a>
      </div>

      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[18px] border border-dashed border-[color:var(--line-2)] bg-white px-4 py-6 text-center text-sm transition hover:bg-[var(--surface-paper)]">
        <FileUp size={24} className="text-[var(--teal)]" />
        <span className="font-semibold text-[var(--ink)]">
          {file ? file.name : 'Selecionar CSV'}
        </span>
        <span className="text-[var(--muted)]">
          As questões entram como rascunhos do autor.
        </span>
        <input
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          data-testid="bulk-import-file"
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null)
            setError(null)
            setResult(null)
          }}
        />
      </label>

      {error && (
        <p className="rounded-[var(--radius-sm)] bg-[var(--danger-bg)] px-3 py-2 text-sm text-[var(--danger)]">
          {error}
        </p>
      )}

      {result && (
        <div
          className="rounded-[18px] border border-[color:var(--line)] bg-white px-4 py-3"
          data-testid="bulk-import-result"
        >
          <div className="flex flex-wrap gap-2 text-sm font-semibold">
            <span className="rounded-full bg-[var(--teal-light)] px-3 py-1 text-[var(--teal-ink)]">
              {result.imported} {result.imported === 1 ? 'importada' : 'importadas'}
            </span>
            <span className="rounded-full bg-[var(--warn-bg)] px-3 py-1 text-[var(--warn)]">
              {result.failed} {result.failed === 1 ? 'falhou' : 'falharam'}
            </span>
          </div>
          {visibleErrors.length > 0 && (
            <ul className="mt-3 max-h-48 overflow-y-auto text-sm text-[var(--muted)]">
              {visibleErrors.map((rowError, index) => (
                <li key={`${rowError.line}-${rowError.field}-${index}`}>
                  Linha {rowError.line}: {rowError.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-[color:var(--line-2)] px-4 py-2 text-sm font-semibold text-[var(--muted)] transition hover:bg-[var(--surface-paper)]"
        >
          Fechar
        </button>
        <button
          type="submit"
          disabled={!file || submitting}
          className="aprova-button text-sm disabled:bg-[var(--hint)]"
          data-testid="bulk-import-submit"
        >
          <FileUp size={17} />
          {submitting ? 'Importando...' : 'Importar'}
        </button>
      </div>
    </form>
  )
}
