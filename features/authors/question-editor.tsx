'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, X, Search, Bold, Italic, Underline, Strikethrough, Image as ImageIcon } from 'lucide-react'
import {
  AlternativesEditor,
  labelForIndex,
  type EditableAlternative,
} from './alternatives-editor'
import type { Difficulty, SourceType } from '@/lib/validation/schemas'
import { ClassificationCatalogDialog } from './classification-catalog-dialog'
import { compressToWebP } from '@/lib/utils/image-compression'
import { createSupabaseBrowserClient } from '@/lib/db/browser'
import { safeUUID } from '@/lib/utils/uuid'

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
  image_path?: string | null
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
  const [subjectOptions, setSubjectOptions] = useState<SubjectOption[]>(subjects)
  const [subjectId, setSubjectId] = useState(initial?.subject_id ?? '')
  // Board options are local state so a board added inline/modal shows up immediately.
  const [boardOptions, setBoardOptions] = useState<Option[]>(boards)
  const [boardId, setBoardId] = useState(initial?.board_id ?? '')
  const [difficulty, setDifficulty] = useState<Difficulty | ''>(
    initial ? initial.difficulty ?? '' : 'media',
  )
  const [statement, setStatement] = useState(initial?.statement ?? '')
  const [generalComment, setGeneralComment] = useState(initial?.general_comment ?? '')
  const [alternatives, setAlternatives] = useState<EditableAlternative[]>(() =>
    (initial?.alternatives ?? [
      { text: '', is_correct: true, alternative_comment: '' },
      { text: '', is_correct: false, alternative_comment: '' },
    ]).map((alt) => ({
      ...alt,
      id: alt.id || safeUUID(),
    }))
  )
  
  // Assuntos (Topics) list
  const [tags, setTags] = useState<{ id: string; name: string; slug: string; subject_id: string | null }[]>(
    initial?.tags ?? [],
  )

  const [errors, setErrors] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [showClassificationWarning, setShowClassificationWarning] = useState(Boolean(initial))
  const [pendingCareerSwap, setPendingCareerSwap] = useState<string | null>(null)

  // Text refs for selection formatting
  const statementRef = useRef<HTMLTextAreaElement>(null)
  const commentRef = useRef<HTMLTextAreaElement>(null)

  // Image states
  const [imagePath, setImagePath] = useState<string | null>(initial?.image_path ?? null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(
    initial?.image_path
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/question-images/${initial.image_path}`
      : null
  )
  const [isImageDeleted, setIsImageDeleted] = useState(false)

  // Helper to wrap selected text in markdown characters
  function insertFormatting(
    textareaRef: React.RefObject<HTMLTextAreaElement | null>,
    setValue: (val: string) => void,
    prefix: string,
    suffix = prefix
  ) {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const value = textarea.value
    const selection = value.substring(start, end)
    const wrapped = prefix + selection + suffix
    const newValue = value.substring(0, start) + wrapped + value.substring(end)

    setValue(newValue)
    setIsDirty(true)

    // Re-focus and set selection
    setTimeout(() => {
      textarea.focus()
      const newCursorStart = start + prefix.length
      const newCursorEnd = end + prefix.length
      textarea.setSelectionRange(newCursorStart, newCursorEnd)
    }, 0)
  }

  // Image handlers
  const handleImageChange = async (file: File) => {
    try {
      const compressedBlob = await compressToWebP(file)
      const previewUrl = URL.createObjectURL(compressedBlob)
      setImagePreview(previewUrl)
      const compressedFile = new File([compressedBlob], `image_${Date.now()}.webp`, {
        type: 'image/webp'
      })
      setImageFile(compressedFile)
      setIsDirty(true)
      setIsImageDeleted(false)
    } catch (err) {
      console.error('Failed to compress image:', err)
      setErrors((prev) => [...prev, 'Falha ao processar e comprimir a imagem.'])
    }
  }

  const handleImageRemove = () => {
    setImageFile(null)
    setImagePreview(null)
    setIsImageDeleted(true)
    setIsDirty(true)
  }

  async function handleImageStorageOperations(qId: string): Promise<string | null | undefined> {
    if (!isImageDeleted && !imageFile) {
      return imagePath
    }

    const supabase = createSupabaseBrowserClient()

    if (isImageDeleted) {
      if (imagePath) {
        await supabase.storage.from('question-images').remove([imagePath])
      }
      setImagePath(null)
      return null
    }

    if (imageFile) {
      if (imagePath) {
        await supabase.storage.from('question-images').remove([imagePath])
      }
      const filePath = `questions/${qId}/${Date.now()}.webp`
      const { error: uploadError } = await supabase.storage
        .from('question-images')
        .upload(filePath, imageFile, { upsert: true })
      if (uploadError) {
        throw uploadError
      }
      setImageFile(null)
      setImagePath(filePath)
      return filePath
    }

    return imagePath
  }

  useEffect(() => {
    if (!isDirty) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
      return ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isDirty])

  // Catalog Dialog States
  const [isCatalogOpen, setIsCatalogOpen] = useState(false)
  const [catalogTab, setCatalogTab] = useState<'disciplines' | 'topics' | 'boards'>('disciplines')

  function buildPayload(currentImagePath?: string | null) {
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
      image_path: currentImagePath !== undefined ? currentImagePath : imagePath,
    }
  }

  const pendingClassification = [
    !careerId ? 'carreira' : null,
    !subjectId ? 'disciplina' : null,
    !difficulty ? 'dificuldade' : null,
  ].filter((field): field is string => Boolean(field))

  // Persist (create or update) and return the question id, or null on failure.
  async function save(): Promise<string | null> {
    setErrors([])
    try {
      const currentId = questionId
      let nextImagePath = imagePath

      // If updating an existing question, perform storage operations first
      if (currentId) {
        const resultPath = await handleImageStorageOperations(currentId)
        if (resultPath !== undefined) {
          nextImagePath = resultPath
        }
      }

      const payload = buildPayload(nextImagePath)
      const res = currentId
        ? await fetch(`/api/author/questions/${currentId}`, {
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

      const newId = json.data.id

      // If we just created the question (POST) and have an image to upload:
      if (!currentId && (imageFile || isImageDeleted)) {
        const resultPath = await handleImageStorageOperations(newId)
        if (resultPath !== undefined) {
          // Send PATCH to associate the uploaded image path with the new question
          const patchPayload = buildPayload(resultPath)
          const patchRes = await fetch(`/api/author/questions/${newId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patchPayload),
          })
          const patchJson: ApiEnvelope<{ id: string }> = await patchRes.json()
          if (!patchJson.success) {
            setErrors([patchJson.error.message])
            return null
          }
        }
      }

      setQuestionId(newId)
      setIsImageDeleted(false)
      return newId
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar a questão'
      setErrors([msg])
      return null
    }
  }

  async function onSaveDraft() {
    setBusy(true)
    setErrors([])
    setSavedMsg(null)
    const id = await save()
    setBusy(false)
    if (id) {
      setSavedMsg('Rascunho salvo.')
      setIsDirty(false)
    }
  }

  async function onPublish() {
    setBusy(true)
    setErrors([])
    setSavedMsg(null)
    if (pendingClassification.length > 0) {
      setShowClassificationWarning(true)
      setBusy(false)
      return
    }
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
    setIsDirty(false)
    router.push('/author/questions')
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-4" data-testid="question-editor">
      {pendingCareerSwap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[var(--paper)] rounded-[var(--radius-sm)] border border-[var(--line)] max-w-md w-full p-6 shadow-lg flex flex-col gap-4">
            <h3 className="text-lg font-semibold text-[var(--ink)]">Alterar Carreira?</h3>
            <p className="text-sm text-[var(--muted)]">
              Alterar a carreira limpará a disciplina e os assuntos selecionados. Deseja continuar?
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingCareerSwap(null)}
                className="aprova-button aprova-button-ghost px-4 py-2 text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setCareerId(pendingCareerSwap)
                  setSubjectId('')
                  setTags([])
                  setIsDirty(true)
                  setPendingCareerSwap(null)
                }}
                className="aprova-button bg-[var(--danger)] hover:bg-[var(--danger)]/90 text-white px-4 py-2 text-sm border-none"
              >
                Sim, alterar
              </button>
            </div>
          </div>
        </div>
      )}
      {showClassificationWarning && pendingClassification.length > 0 && (
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
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm font-semibold text-[var(--ink)]">
          Carreira
          <select
            value={careerId}
            onChange={(e) => {
              const nextVal = e.target.value
              if (subjectId || tags.length > 0) {
                setPendingCareerSwap(nextVal)
              } else {
                setCareerId(nextVal)
                setIsDirty(true)
              }
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
          <button
            type="button"
            onClick={() => {
              setCatalogTab('disciplines')
              setIsCatalogOpen(true)
            }}
            data-testid="discipline-catalog"
            className="aprova-field w-full flex items-center justify-between min-h-[38px] bg-[var(--paper)] py-1.5 px-3 border border-[var(--line)] rounded-[var(--radius-sm)] cursor-pointer hover:border-[var(--teal)] transition-colors text-left font-normal"
          >
            <span
              className={subjectId ? 'text-[var(--ink)] font-normal' : 'text-[var(--muted)] font-normal'}
              data-testid="subject-value"
            >
              {subjectOptions.find((s) => s.id === subjectId)?.name ?? 'Nenhuma selecionada'}
            </span>
            <Search size={16} className="text-[var(--muted)] shrink-0" />
          </button>
        </div>

        {/* Banca Selector */}
        <div className="flex flex-col gap-1 text-sm font-semibold text-[var(--ink)]">
          <span>Banca (opcional)</span>
          <button
            type="button"
            onClick={() => {
              setCatalogTab('boards')
              setIsCatalogOpen(true)
            }}
            data-testid="board-catalog"
            className="aprova-field w-full flex items-center justify-between min-h-[38px] bg-[var(--paper)] py-1.5 px-3 border border-[var(--line)] rounded-[var(--radius-sm)] cursor-pointer hover:border-[var(--teal)] transition-colors text-left font-normal"
          >
            <span
              className={boardId ? 'text-[var(--ink)] font-normal' : 'text-[var(--muted)] font-normal'}
              data-testid="board-value"
            >
              {boardOptions.find((b) => b.id === boardId)?.name ?? 'Nenhuma selecionada'}
            </span>
            <Search size={16} className="text-[var(--muted)] shrink-0" />
          </button>
        </div>

        <label className="flex flex-col gap-1 text-sm font-semibold text-[var(--ink)]">
          Dificuldade
          <select
            value={difficulty}
            onChange={(e) => {
              setDifficulty(e.target.value ? (e.target.value as Difficulty) : '')
              setIsDirty(true)
            }}
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

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-sm font-semibold text-[var(--ink)]">
          <span>Enunciado</span>
          <span className="text-xs font-normal text-[var(--muted)]" data-testid="statement-char-count">
            {statement.length} caracteres
          </span>
        </div>
        {/* Formatting Toolbar for Statement */}
        <div className="flex gap-1 mb-1 border-b border-[var(--line)] pb-1" data-testid="statement-formatting-toolbar">
          <button
            type="button"
            onClick={() => insertFormatting(statementRef, setStatement, '**')}
            title="Negrito"
            className="p-1.5 hover:bg-[var(--surface-hover)] rounded text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
          >
            <Bold size={16} />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting(statementRef, setStatement, '*')}
            title="Itálico"
            className="p-1.5 hover:bg-[var(--surface-hover)] rounded text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
          >
            <Italic size={16} />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting(statementRef, setStatement, '<u>', '</u>')}
            title="Sublinhado"
            className="p-1.5 hover:bg-[var(--surface-hover)] rounded text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
          >
            <Underline size={16} />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting(statementRef, setStatement, '~~')}
            title="Riscado"
            className="p-1.5 hover:bg-[var(--surface-hover)] rounded text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
          >
            <Strikethrough size={16} />
          </button>
        </div>
        <textarea
          ref={statementRef}
          value={statement}
          onChange={(e) => {
            setStatement(e.target.value)
            setIsDirty(true)
          }}
          rows={8}
          data-testid="statement"
          className="aprova-field"
        />
      </div>

      {/* Upload de Imagem */}
      <div className="flex flex-col gap-2 text-sm font-semibold text-[var(--ink)]" data-testid="statement-image-upload">
        <span>Imagem do Enunciado (opcional)</span>
        {imagePreview ? (
          <div className="relative w-fit rounded-[var(--radius-sm)] border border-[var(--line)] p-2 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreview}
              alt="Preview do enunciado"
              className="max-h-[200px] rounded-[var(--radius-sm)] object-contain"
            />
            <button
              type="button"
              onClick={handleImageRemove}
              className="absolute -top-2 -right-2 p-1 bg-[var(--danger)] hover:bg-[var(--danger)]/90 text-white rounded-full transition shadow-md cursor-pointer"
              title="Remover imagem"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-[var(--line-2)] rounded-[var(--radius-sm)] bg-[var(--paper)] py-6 px-4 hover:border-[var(--teal)] transition-colors cursor-pointer text-center font-normal text-[var(--muted)]">
            <ImageIcon size={24} className="mb-2 text-[var(--muted)]" />
            <span className="text-sm font-semibold text-[var(--ink)]">Selecione uma imagem</span>
            <span className="text-xs">Clique ou arraste e solte para buscar (PNG, JPG, WebP)</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleImageChange(file)
              }}
              className="hidden"
            />
          </label>
        )}
      </div>

      <AlternativesEditor
        alternatives={alternatives}
        onChange={(next) => {
          setAlternatives(next)
          setIsDirty(true)
        }}
      />

      {/* Assuntos (Topics) Selector & Chips */}
      <div className="flex flex-col gap-2 text-sm font-semibold text-[var(--ink)]">
        <div className="flex items-center justify-between">
          <span>Assuntos</span>
          <button
            type="button"
            disabled={!subjectId}
            onClick={() => {
              setCatalogTab('topics')
              setIsCatalogOpen(true)
            }}
            data-testid="topics-catalog"
            className="text-xs font-bold text-[var(--teal)] underline hover:opacity-80 disabled:opacity-50 disabled:text-[var(--muted)] disabled:no-underline cursor-pointer disabled:cursor-not-allowed"
          >
            Gerenciar Assuntos
          </button>
        </div>
        {!subjectId ? (
          <span className="text-xs font-normal text-[var(--muted)]">
            Selecione uma disciplina primeiro para liberar a seleção de assuntos.
          </span>
        ) : tags.length > 0 ? (
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
                    setIsDirty(true)
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

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-sm font-semibold text-[var(--ink)]">
          <span>Comentário geral (obrigatório para publicar)</span>
          <span className="text-xs font-normal text-[var(--muted)]" data-testid="comment-char-count">
            {(generalComment || '').length} caracteres
          </span>
        </div>
        {/* Formatting Toolbar for General Comment */}
        <div className="flex gap-1 mb-1 border-b border-[var(--line)] pb-1" data-testid="comment-formatting-toolbar">
          <button
            type="button"
            onClick={() => insertFormatting(commentRef, setGeneralComment, '**')}
            title="Negrito"
            className="p-1.5 hover:bg-[var(--surface-hover)] rounded text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
          >
            <Bold size={16} />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting(commentRef, setGeneralComment, '*')}
            title="Itálico"
            className="p-1.5 hover:bg-[var(--surface-hover)] rounded text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
          >
            <Italic size={16} />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting(commentRef, setGeneralComment, '<u>', '</u>')}
            title="Sublinhado"
            className="p-1.5 hover:bg-[var(--surface-hover)] rounded text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
          >
            <Underline size={16} />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting(commentRef, setGeneralComment, '~~')}
            title="Riscado"
            className="p-1.5 hover:bg-[var(--surface-hover)] rounded text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
          >
            <Strikethrough size={16} />
          </button>
        </div>
        <textarea
          ref={commentRef}
          value={generalComment}
          onChange={(e) => {
            setGeneralComment(e.target.value)
            setIsDirty(true)
          }}
          rows={3}
          data-testid="general-comment"
          className="aprova-field"
        />
      </div>

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

      <div className="flex flex-wrap items-center gap-3">
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
        {isDirty && (
          <span className="text-xs text-[var(--warn)] flex items-center gap-1.5 font-medium animate-pulse" data-testid="unsaved-changes-indicator">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--warn)]" />
            Alterações não salvas
          </span>
        )}
      </div>

      {/* Shared Catalog Management Dialog */}
      <ClassificationCatalogDialog
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        initialTab={catalogTab}
        careers={careers}
        currentCareerId={careerId}
        currentDisciplineId={subjectId}
        currentDisciplineName={
          subjectOptions.find((subject) => subject.id === subjectId)?.name
        }
        onSelectDiscipline={(discipline) => {
          if (subjectId && subjectId !== discipline.id) {
            setTags(tags.filter((t) => t.subject_id === discipline.id))
          }
          setSubjectOptions((previous) =>
            previous.some((subject) => subject.id === discipline.id)
              ? previous
              : [...previous, { ...discipline, career_id: careerId }],
          )
          setSubjectId(discipline.id)
          setIsDirty(true)
          return true
        }}
        onSelectBoard={(board) => {
          setBoardOptions((prev) =>
            prev.some((b) => b.id === board.id) ? prev : [...prev, board],
          )
          setBoardId(board.id)
          setIsDirty(true)
        }}
        selectedTopicIds={tags.map((t) => t.id)}
        selectedTopics={tags}
        onConfirmTopics={(_topicIds, topics) => {
          setTags(topics)
          setIsDirty(true)
        }}
      />
    </div>
  )
}
