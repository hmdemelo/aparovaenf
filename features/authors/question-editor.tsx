'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
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

      <label className="flex flex-col gap-1 text-sm font-semibold text-[var(--ink)]">
        Banca (opcional)
        <select
          value={boardId}
          onChange={(e) => setBoardId(e.target.value)}
          className="aprova-field sm:w-1/3"
        >
          <option value="">Nenhuma</option>
          {boards.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </label>

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
