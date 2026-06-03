'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import {
  AlternativesEditor,
  labelForIndex,
  type EditableAlternative,
} from './alternatives-editor'
import type { Difficulty } from '@/lib/validation/schemas'

type Option = { id: string; name: string }
type SubjectOption = Option & { career_id: string }

export type EditorInitial = {
  id: string
  career_id: string
  subject_id: string
  board_id: string | null
  difficulty: Difficulty
  statement: string
  general_comment: string | null
  alternatives: EditableAlternative[]
  tags?: string[]
}

type Props = {
  careers: Option[]
  subjects: SubjectOption[]
  boards: Option[]
  initial?: EditorInitial
}

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } }

type TagSuggestion = { id: string; name: string; slug: string }

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'facil', label: 'Fácil' },
  { value: 'media', label: 'Média' },
  { value: 'dificil', label: 'Difícil' },
]

/** Create/edit form for an author question, with save-draft and publish. */
export function QuestionEditor({ careers, subjects, boards, initial }: Props) {
  const router = useRouter()
  const [questionId, setQuestionId] = useState<string | null>(initial?.id ?? null)
  const [careerId, setCareerId] = useState(initial?.career_id ?? careers[0]?.id ?? '')
  const [subjectId, setSubjectId] = useState(initial?.subject_id ?? '')
  // Board options are local state so a board added inline shows up immediately.
  const [boardOptions, setBoardOptions] = useState<Option[]>(boards)
  const [boardId, setBoardId] = useState(initial?.board_id ?? '')
  const [difficulty, setDifficulty] = useState<Difficulty>(
    initial?.difficulty ?? 'media',
  )
  const [statement, setStatement] = useState(initial?.statement ?? '')
  const [generalComment, setGeneralComment] = useState(initial?.general_comment ?? '')
  const [alternatives, setAlternatives] = useState<EditableAlternative[]>(
    initial?.alternatives ?? [
      { text: '', is_correct: true, alternative_comment: '' },
      { text: '', is_correct: false, alternative_comment: '' },
    ],
  )
  const [tags, setTags] = useState<string[]>(initial?.tags ?? [])
  const [errors, setErrors] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)

  const careerSubjects = useMemo(
    () => subjects.filter((s) => s.career_id === careerId),
    [subjects, careerId],
  )

  function buildPayload() {
    return {
      career_id: careerId,
      subject_id: subjectId,
      board_id: boardId || null,
      difficulty,
      source_type: 'autoral' as const,
      statement,
      general_comment: generalComment || null,
      alternatives: alternatives.map((a, index) => ({
        label: labelForIndex(index),
        text: a.text,
        is_correct: a.is_correct,
        alternative_comment: a.alternative_comment || null,
      })),
      tags,
    }
  }

  // Persist (create or update) and return the question id, or null on failure.
  async function save(): Promise<string | null> {
    const payload = buildPayload()
    const res = questionId
      ? await fetch(`/api/author/questions/${questionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      : await fetch('/api/author/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
    const json: ApiEnvelope<{ id: string }> = await res.json()
    if (!json.success) {
      setErrors([json.error.message])
      return null
    }
    setQuestionId(json.data.id)
    return json.data.id
  }

  async function onSaveDraft() {
    setBusy(true)
    setErrors([])
    setSavedMsg(null)
    const id = await save()
    setBusy(false)
    if (id) setSavedMsg('Rascunho salvo.')
  }

  async function onPublish() {
    setBusy(true)
    setErrors([])
    setSavedMsg(null)
    const id = await save()
    if (!id) {
      setBusy(false)
      return
    }
    const res = await fetch(`/api/author/questions/${id}/publish`, { method: 'POST' })
    const json: ApiEnvelope<{ id: string }> = await res.json()
    setBusy(false)
    if (!json.success) {
      setErrors(json.error.message.split('; '))
      return
    }
    router.push('/author/questions')
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-4" data-testid="question-editor">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm font-semibold text-[var(--ink)]">
          Carreira
          <select
            value={careerId}
            onChange={(e) => {
              setCareerId(e.target.value)
              setSubjectId('')
            }}
            data-testid="career"
            className="aprova-field"
          >
            {careers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-[var(--ink)]">
          Assunto
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            data-testid="subject"
            className="aprova-field"
          >
            <option value="">Selecione</option>
            {careerSubjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-[var(--ink)]">
          Dificuldade
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            data-testid="difficulty"
            className="aprova-field"
          >
            {DIFFICULTIES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <BoardCombobox
        options={boardOptions}
        boardId={boardId}
        onSelect={setBoardId}
        onCreated={(board) => {
          setBoardOptions((prev) =>
            prev.some((b) => b.id === board.id) ? prev : [...prev, board],
          )
          setBoardId(board.id)
        }}
        onError={(message) => setErrors([message])}
      />

      <label className="flex flex-col gap-1 text-sm font-semibold text-[var(--ink)]">
        Enunciado
        <textarea
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          rows={4}
          data-testid="statement"
          className="aprova-field"
        />
      </label>

      <AlternativesEditor alternatives={alternatives} onChange={setAlternatives} />

      <TagInput tags={tags} onChange={setTags} />

      <label className="flex flex-col gap-1 text-sm font-semibold text-[var(--ink)]">
        Comentário geral (obrigatório para publicar)
        <textarea
          value={generalComment}
          onChange={(e) => setGeneralComment(e.target.value)}
          rows={3}
          data-testid="general-comment"
          className="aprova-field"
        />
      </label>

      {errors.length > 0 && (
        <ul
          className="rounded-[var(--radius-sm)] bg-[var(--danger-bg)] px-4 py-2 text-sm text-[var(--danger)]"
          data-testid="editor-errors"
        >
          {errors.map((e) => (
            <li key={e}>• {e}</li>
          ))}
        </ul>
      )}
      {savedMsg && <p className="text-sm text-[var(--teal)]">{savedMsg}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={busy}
          data-testid="save-draft"
          className="aprova-button aprova-button-ghost py-3 disabled:opacity-50"
        >
          Salvar rascunho
        </button>
        <button
          type="button"
          onClick={onPublish}
          disabled={busy}
          data-testid="publish"
          className="aprova-button py-3 disabled:bg-[var(--hint)]"
        >
          Publicar
        </button>
      </div>
    </div>
  )
}

/**
 * Searchable board field. Filters existing boards by the typed text; when no
 * board matches, offers a "+" button that registers the board inline via
 * POST /api/boards and auto-selects it.
 */
function BoardCombobox({
  options,
  boardId,
  onSelect,
  onCreated,
  onError,
}: {
  options: Option[]
  boardId: string
  onSelect: (id: string) => void
  onCreated: (board: Option) => void
  onError: (message: string) => void
}) {
  const selectedName = options.find((b) => b.id === boardId)?.name ?? ''
  const [query, setQuery] = useState(selectedName)
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  const trimmed = query.trim()
  const filtered = trimmed
    ? options.filter((b) => b.name.toLowerCase().includes(trimmed.toLowerCase()))
    : options
  const exactMatch = options.some(
    (b) => b.name.toLowerCase() === trimmed.toLowerCase(),
  )
  const canCreate = trimmed.length > 0 && !exactMatch

  async function createBoard() {
    setCreating(true)
    try {
      const res = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      const json: ApiEnvelope<Option> = await res.json()
      if (!json.success) {
        onError(json.error.message)
        return
      }
      onCreated(json.data)
      setQuery(json.data.name)
      setOpen(false)
    } catch {
      onError('Não foi possível cadastrar a banca.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="flex flex-col gap-1 text-sm font-semibold text-[var(--ink)] sm:w-1/2">
      <label htmlFor="board-search">Banca (opcional)</label>
      <div className="relative flex gap-2">
        <input
          id="board-search"
          type="text"
          value={query}
          placeholder="Buscar banca..."
          autoComplete="off"
          data-testid="board-search"
          className="aprova-field flex-1"
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            if (!e.target.value.trim()) onSelect('')
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        {canCreate && (
          <button
            type="button"
            onClick={createBoard}
            disabled={creating}
            data-testid="board-add"
            aria-label={`Adicionar banca ${trimmed}`}
            className="aprova-button flex items-center justify-center px-3 disabled:opacity-50"
          >
            <Plus size={18} />
          </button>
        )}
        {open && filtered.length > 0 && (
          <ul
            className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-auto rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--paper)] py-1 shadow-lg"
            data-testid="board-options"
          >
            <li>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm font-normal text-[var(--muted)] hover:bg-[var(--surface)]"
                onMouseDown={(e) => {
                  e.preventDefault()
                  onSelect('')
                  setQuery('')
                  setOpen(false)
                }}
              >
                Nenhuma
              </button>
            </li>
            {filtered.map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm font-normal text-[var(--ink)] hover:bg-[var(--surface)]"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    onSelect(b.id)
                    setQuery(b.name)
                    setOpen(false)
                  }}
                >
                  {b.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

/**
 * Multi-select tag field with instant creation. Type a tag and press Enter (or
 * pick a suggestion) to add it; suggestions come from GET /api/tags. Tags are
 * stored as free-form names — the server slugifies and upserts them on save.
 */
function TagInput({
  tags,
  onChange,
}: {
  tags: string[]
  onChange: (tags: string[]) => void
}) {
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const term = input.trim()
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!term) {
      // Clearing suggestions when the field empties is the intended sync.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSuggestions([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/tags?q=${encodeURIComponent(term)}`)
        const json: ApiEnvelope<{ tags: TagSuggestion[] }> = await res.json()
        if (json.success) setSuggestions(json.data.tags)
      } catch {
        setSuggestions([])
      }
    }, 200)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [input])

  function addTag(name: string) {
    const clean = name.trim()
    if (!clean) return
    if (!tags.some((t) => t.toLowerCase() === clean.toLowerCase())) {
      onChange([...tags, clean])
    }
    setInput('')
    setSuggestions([])
    setOpen(false)
  }

  function removeTag(name: string) {
    onChange(tags.filter((t) => t !== name))
  }

  const available = suggestions.filter(
    (s) => !tags.some((t) => t.toLowerCase() === s.name.toLowerCase()),
  )

  return (
    <div className="flex flex-col gap-1 text-sm font-semibold text-[var(--ink)]">
      <label htmlFor="tag-input">Tags (subassuntos)</label>
      {tags.length > 0 && (
        <ul className="flex flex-wrap gap-2" data-testid="tag-chips">
          {tags.map((t) => (
            <li
              key={t}
              className="flex items-center gap-1 rounded-full bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[var(--ink)]"
            >
              {t}
              <button
                type="button"
                onClick={() => removeTag(t)}
                aria-label={`Remover tag ${t}`}
                className="text-[var(--muted)] transition hover:text-[var(--danger)]"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="relative">
        <input
          id="tag-input"
          type="text"
          value={input}
          placeholder="Digite e pressione Enter"
          autoComplete="off"
          data-testid="tag-input"
          className="aprova-field"
          onChange={(e) => {
            setInput(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addTag(input)
            }
          }}
        />
        {open && available.length > 0 && (
          <ul
            className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-auto rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--paper)] py-1 shadow-lg"
            data-testid="tag-suggestions"
          >
            {available.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm font-normal text-[var(--ink)] hover:bg-[var(--surface)]"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    addTag(s.name)
                  }}
                >
                  {s.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
