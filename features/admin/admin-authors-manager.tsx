'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, FileUp, PencilLine, Plus, Save, Trash2, X } from 'lucide-react'
import { CreateAuthorForm } from './create-author-form'
import { BulkQuestionImportDialog } from './bulk-question-import-dialog'
import { DeleteAuthorDialog } from './delete-author-dialog'
import type { AdminAuthorRow } from './admin-service'

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } }

type DialogProps = {
  title: string
  description?: string
  children: ReactNode
  onClose: () => void
}

function AuthorDialog({ title, description, children, onClose }: DialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(14,31,26,0.46)] px-4 py-6"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="author-dialog-title"
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[22px] border border-[color:var(--line)] bg-white shadow-[0_30px_70px_-34px_rgba(14,31,26,0.55)]"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[color:var(--line)] bg-white px-5 py-4">
          <div>
            <h2
              id="author-dialog-title"
              className="font-display text-[23px] font-semibold text-[var(--ink)]"
            >
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-full p-2 text-[var(--muted)] transition hover:bg-[var(--surface-paper)] hover:text-[var(--ink)]"
            data-testid="dialog-close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

function EditAuthorForm({
  author,
  onDone,
}: {
  author: AdminAuthorRow
  onDone: () => void
}) {
  const router = useRouter()
  const [displayName, setDisplayName] = useState(author.displayName)
  const [shortBio, setShortBio] = useState(author.shortBio ?? '')
  const [instagram, setInstagram] = useState(author.instagram ?? '')
  const [isPublic, setIsPublic] = useState(author.isPublic)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/authors/${author.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName,
          short_bio: shortBio || null,
          instagram: instagram || null,
          is_public: isPublic,
        }),
      })
      const json: ApiEnvelope<{ author: AdminAuthorRow }> = await response.json()
      if (!json.success) {
        setError(json.error.message)
        return
      }

      router.refresh()
      onDone()
    } catch {
      setError('Não foi possível atualizar o autor.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3" data-testid="edit-author-form">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-[var(--muted)]">Nome de exibição</span>
        <input
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          required
          maxLength={120}
          className="aprova-field"
          data-testid="edit-author-display-name"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-[var(--muted)]">Instagram</span>
        <input
          value={instagram}
          onChange={(event) => setInstagram(event.target.value)}
          maxLength={60}
          placeholder="@perfil"
          className="aprova-field"
          data-testid="edit-author-instagram"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-[var(--muted)]">Bio</span>
        <textarea
          value={shortBio}
          onChange={(event) => setShortBio(event.target.value)}
          maxLength={280}
          rows={4}
          className="aprova-field resize-none"
          data-testid="edit-author-bio"
        />
      </label>

      <label className="flex items-center justify-between gap-3 rounded-[18px] border border-[color:var(--line)] bg-[var(--surface-paper)] px-4 py-3 text-sm">
        <span>
          <span className="block font-semibold text-[var(--ink)]">
            Exibir na landing
          </span>
          <span className="text-[var(--muted)]">
            Controla a visibilidade pública do perfil do autor.
          </span>
        </span>
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(event) => setIsPublic(event.target.checked)}
          className="h-5 w-5 accent-[var(--teal)]"
          data-testid="edit-author-public"
        />
      </label>

      {error && (
        <p className="rounded-[var(--radius-sm)] bg-[var(--danger-bg)] px-3 py-2 text-sm text-[var(--danger)]">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="aprova-button disabled:bg-[var(--hint)]"
        data-testid="edit-author-submit"
      >
        <Save size={18} />
        {saving ? 'Salvando...' : 'Salvar perfil'}
      </button>
    </form>
  )
}

export function AdminAuthorsManager({ authors }: { authors: AdminAuthorRow[] }) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<AdminAuthorRow | null>(null)
  const [importing, setImporting] = useState<AdminAuthorRow | null>(null)
  const [deleting, setDeleting] = useState<AdminAuthorRow | null>(null)

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.04em] text-[var(--muted)]">
            Administrativo
          </p>
          <h1 className="mt-1 text-[27px] font-semibold leading-tight text-[var(--ink)]">
            Autores
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="aprova-button text-sm"
          data-testid="open-create-author"
        >
          <Plus size={17} />
          Novo autor
        </button>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.04em] text-[var(--muted)]">
          {authors.length} {authors.length === 1 ? 'autor' : 'autores'}
        </h2>
        <ul className="flex flex-col gap-2" data-testid="admin-authors">
          {authors.map((author) => (
            <li
              key={author.id}
              className="flex items-center justify-between gap-4 rounded-[18px] border border-[color:var(--line)] bg-white/82 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--ink)]">
                  {author.displayName}
                </p>
                <p className="truncate text-xs text-[var(--muted)]">
                  {author.email ?? 'sem e-mail'}
                  {author.instagram ? ` · ${author.instagram}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2 text-xs">
                <span className="rounded-full bg-[var(--teal-light)] px-2 py-1 text-[var(--teal-ink)]">
                  {author.questionCount} publicadas
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${
                    author.isPublic
                      ? 'bg-[var(--teal-light)] text-[var(--teal-ink)]'
                      : 'bg-[var(--warn-bg)] text-[var(--warn)]'
                  }`}
                >
                  {author.isPublic ? <Eye size={13} /> : <EyeOff size={13} />}
                  {author.isPublic ? 'público' : 'oculto'}
                </span>
                <button
                  type="button"
                  onClick={() => setEditing(author)}
                  className="inline-flex items-center gap-1 rounded-full border border-[color:var(--line-2)] px-3 py-1 font-semibold text-[var(--teal)] transition hover:bg-[rgba(160,243,212,0.24)]"
                  data-testid="open-edit-author"
                >
                  <PencilLine size={14} />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => setImporting(author)}
                  className="inline-flex items-center gap-1 rounded-full border border-[color:var(--line-2)] px-3 py-1 font-semibold text-[var(--teal)] transition hover:bg-[rgba(160,243,212,0.24)]"
                  data-testid="open-import-author"
                >
                  <FileUp size={14} />
                  Importar
                </button>
                <button
                  type="button"
                  onClick={() => setDeleting(author)}
                  className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1 font-semibold text-red-600 transition hover:bg-red-50"
                  data-testid="open-delete-author"
                >
                  <Trash2 size={14} />
                  Deletar
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {creating && (
        <AuthorDialog
          title="Novo autor"
          description="Cadastre o acesso inicial do enfermeiro autor."
          onClose={() => setCreating(false)}
        >
          <CreateAuthorForm onDone={() => setCreating(false)} />
        </AuthorDialog>
      )}

      {editing && (
        <AuthorDialog
          title="Editar autor"
          description={editing.email ?? 'Perfil do autor'}
          onClose={() => setEditing(null)}
        >
          <EditAuthorForm author={editing} onDone={() => setEditing(null)} />
        </AuthorDialog>
      )}

      {importing && (
        <AuthorDialog
          title="Importar questões"
          description={importing.email ?? 'Rascunhos para edicao do autor'}
          onClose={() => setImporting(null)}
        >
          <BulkQuestionImportDialog
            author={{
              id: importing.id,
              displayName: importing.displayName,
            }}
            onClose={() => setImporting(null)}
            onImported={() => router.refresh()}
          />
        </AuthorDialog>
      )}

      {deleting && (
        <AuthorDialog
          title="Deletar autor"
          description={deleting.email ?? 'Perfil do autor'}
          onClose={() => setDeleting(null)}
        >
          <DeleteAuthorDialog
            author={deleting}
            otherAuthors={authors.filter((a) => a.id !== deleting.id)}
            onClose={() => setDeleting(null)}
          />
        </AuthorDialog>
      )}
    </>
  )
}
