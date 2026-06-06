'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, X } from 'lucide-react'
import {
  AlternativesEditor,
  labelForIndex,
  type EditableAlternative,
} from './alternatives-editor'
import type { Difficulty, SourceType } from '@/lib/validation/schemas'
import { ClassificationCatalogDialog } from './classification-catalog-dialog'

type Option = { id: string; name: string }
type SubjectOption = Option & { career_id: string }

export type EditorInitial = {
  id: string
  career_id: string | null
  subject_id: string | null
  board_id: string | null
  difficulty: Difficulty | null
  source_type: SourceType
  source_orgao: string | null
  source_cargo: string | null
  source_year: number | null
  source_reference: string | null
  statement: string
  general_comment: string | null
  alternatives: EditableAlternative[]
  tags?: { id: string; name: string; slug: string; subject_id: string | null }[]
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
  const [careerId, setCareerId] = useState(
    initial ? initial.career_id ?? '' : careers[0]?.id ?? '',
  )
  const [subjectId, setSubjectId] = useState(initial?.subject_id ?? '')
  // Board options are local state so a board added inline/modal shows up immediately.
  const [boardOptions, setBoardOptions] = useState<Option[]>(boards)
  const [boardId, setBoardId] = useState(initial?.board_id ?? '')
  const [difficulty, setDifficulty] = useState<Difficulty | ''>(
    initial ? initial.difficulty ?? '' : 'media',
  )
  const [statement, setStatement] = useState(initial?.statement ?? '')
  const [generalComment, setGeneralComment] = useState(initial?.general_comment ?? '')
  const [alternatives, setAlternatives] = useState<EditableAlternative[]>(
    initial?.alternatives ?? [
      { text: '', is_correct: true, alternative_comment: '' },
      { text: '', is_correct: false, alternative_comment: '' },
    ],
  )
  
  // Assuntos (Topics) list
  const [tags, setTags] = useState<{ id: string; name: string; slug: string; subject_id: string | null }[]>(
    initial?.tags ?? [],
  )

  const [errors, setErrors] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)

  // Catalog Dialog States
  const [isCatalogOpen, setIsCatalogOpen] = useState(false)
  const [catalogTab, setCatalogTab] = useState<'disciplines' | 'topics' | 'boards'>('disciplines')

  function buildPayload() {
    return {
      career_id: careerId || null,
      subject_id: subjectId || null,
      board_id: boardId || null,
      difficulty: difficulty || null,
      source_type: initial?.source_type ?? ('autoral' as const),
      source_orgao: initial?.source_orgao ?? null,
      source_cargo: initial?.source_cargo ?? null,
      source_year: initial?.source_year ?? null,
      source_reference: initial?.source_reference ?? null,
      statement,
      general_comment: generalComment || null,
      alternatives: alternatives.map((a, index) => ({
        label: labelForIndex(index),
        text: a.text,
        is_correct: a.is_correct,
        alternative_comment: a.alternative_comment || null,
      })),
      topic_ids: tags.map((t) => t.id),
    }
  }

  const pendingClassification = [
    !careerId ? 'carreira' : null,
    !subjectId ? 'disciplina' : null,
    !difficulty ? 'dificuldade' : null,
  ].filter((field): field is string => Boolean(field))

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
      {pendingClassification.length > 0 && (
        <div
          className="flex items-start gap-2 rounded-[var(--radius-sm)] bg-[var(--warn-bg)] px-3 py-2 text-sm text-[var(--warn)]"
          data-testid="pending-classification"
        >
          <AlertTriangle size={17} className="mt-0.5 shrink-0" />
          <span>
            Classificação pendente: {pendingClassification.join(', ')}. Complete
            antes de publicar.
          </span>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm font-semibold text-[var(--ink)]">
          Carreira
          <select
            value={careerId}
            onChange={(e) => {
              const nextVal = e.target.value
              if (subjectId || tags.length > 0) {
                const confirmClear = window.confirm(
                  'Alterar a carreira limpará a disciplina e os assuntos selecionados. Deseja continuar?'
                )
                if (!confirmClear) return
              }
              setCareerId(nextVal)
              setSubjectId('')
              setTags([])
            }}
            data-testid="career"
            className="aprova-field"
          >
            <option value="">Selecione</option>
            {careers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        {/* Disciplina Selector */}
        <div className="flex flex-col gap-1 text-sm font-semibold text-[var(--ink)]">
          <span>Disciplina</span>
          <div className="flex gap-2">
            <div className="aprova-field flex-1 flex items-center justify-between min-h-[38px] bg-[var(--paper)] py-1.5 px-3 border border-[var(--line)] rounded-[var(--radius-sm)]">
              <span className={subjectId ? 'text-[var(--ink)] font-normal' : 'text-[var(--muted)] font-normal'}>
                {subjects.find((s) => s.id === subjectId)?.name ?? 'Nenhuma selecionada'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setCatalogTab('disciplines')
                setIsCatalogOpen(true)
              }}
              className="aprova-button px-3"
            >
              Buscar
            </button>
          </div>
        </div>

        <label className="flex flex-col gap-1 text-sm font-semibold text-[var(--ink)]">
          Dificuldade
          <select
            value={difficulty}
            onChange={(e) =>
              setDifficulty(e.target.value ? (e.target.value as Difficulty) : '')
            }
            data-testid="difficulty"
            className="aprova-field"
          >
            <option value="">Selecione</option>
            {DIFFICULTIES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Banca Selector */}
      <div className="flex flex-col gap-1 text-sm font-semibold text-[var(--ink)] sm:w-1/2">
        <span>Banca (opcional)</span>
        <div className="flex gap-2">
          <div className="aprova-field flex-1 flex items-center justify-between min-h-[38px] bg-[var(--paper)] py-1.5 px-3 border border-[var(--line)] rounded-[var(--radius-sm)]">
            <span className={boardId ? 'text-[var(--ink)] font-normal' : 'text-[var(--muted)] font-normal'}>
              {boardOptions.find((b) => b.id === boardId)?.name ?? 'Nenhuma selecionada'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setCatalogTab('boards')
              setIsCatalogOpen(true)
            }}
            className="aprova-button px-3"
          >
            Buscar
          </button>
        </div>
      </div>

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

      {/* Assuntos (Topics) Selector & Chips */}
      <div className="flex flex-col gap-2 text-sm font-semibold text-[var(--ink)]">
        <div className="flex items-center justify-between">
          <span>Assuntos</span>
          <button
            type="button"
            onClick={() => {
              if (!subjectId) {
                alert('Selecione uma disciplina antes de gerenciar os assuntos.')
                return
              }
              setCatalogTab('topics')
              setIsCatalogOpen(true)
            }}
            className="text-xs font-bold text-[var(--teal)] underline hover:opacity-80 disabled:opacity-50 cursor-pointer"
          >
            Gerenciar Assuntos
          </button>
        </div>
        {tags.length > 0 ? (
          <ul className="flex flex-wrap gap-2" data-testid="tag-chips">
            {tags.map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-1 rounded-full bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[var(--ink)] border border-[var(--line)]"
              >
                {t.name}
                <button
                  type="button"
                  onClick={() => {
                    setTags(tags.filter((item) => item.id !== t.id))
                  }}
                  aria-label={`Remover assunto ${t.name}`}
                  className="text-[var(--muted)] transition hover:text-[var(--danger)] cursor-pointer"
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-xs font-normal text-[var(--muted)]">Nenhum assunto selecionado.</span>
        )}
      </div>

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

      {/* Shared Catalog Management Dialog */}
      <ClassificationCatalogDialog
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        initialTab={catalogTab}
        careers={careers}
        currentCareerId={careerId}
        currentDisciplineId={subjectId}
        onSelectDiscipline={(discipline) => {
          if (subjectId && subjectId !== discipline.id) {
            const hasIncompatible = tags.some((t) => t.subject_id !== discipline.id)
            if (hasIncompatible) {
              const confirmClear = window.confirm(
                'A alteração de disciplina removerá os assuntos que não pertencem a ela. Deseja continuar?'
              )
              if (!confirmClear) return
              setTags(tags.filter((t) => t.subject_id === discipline.id))
            }
          }
          setSubjectId(discipline.id)
        }}
        onSelectBoard={(board) => {
          setBoardOptions((prev) =>
            prev.some((b) => b.id === board.id) ? prev : [...prev, board],
          )
          setBoardId(board.id)
        }}
        selectedTopicIds={tags.map((t) => t.id)}
        selectedTopics={tags}
        onConfirmTopics={(topicIds, topics) => {
          setTags(topics)
        }}
      />
    </div>
  )
}
