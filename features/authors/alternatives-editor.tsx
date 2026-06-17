'use client'

import { Plus, Trash2 } from 'lucide-react'
import { safeUUID } from '@/lib/utils/uuid'

export type EditableAlternative = {
  id?: string
  text: string
  is_correct: boolean
  alternative_comment: string
}

/** Letter label for a position (0 -> A, 1 -> B, ...). */
export function labelForIndex(index: number): string {
  return String.fromCharCode(65 + index)
}

type Props = {
  alternatives: EditableAlternative[]
  onChange: (next: EditableAlternative[]) => void
}

/**
 * Variable-length alternatives editor. The author adds/removes options, edits
 * text and an optional per-alternative comment, and marks exactly one correct
 * via radio selection. Labels (A, B, C, ...) are derived from position.
 */
export function AlternativesEditor({ alternatives, onChange }: Props) {
  function update(index: number, patch: Partial<EditableAlternative>) {
    onChange(alternatives.map((a, i) => (i === index ? { ...a, ...patch } : a)))
  }

  function setCorrect(index: number) {
    onChange(alternatives.map((a, i) => ({ ...a, is_correct: i === index })))
  }

  function add() {
    onChange([
      ...alternatives,
      { id: safeUUID(), text: '', is_correct: false, alternative_comment: '' },
    ])
  }

  function remove(index: number) {
    onChange(alternatives.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-[var(--ink)]">Alternativas</p>
      {alternatives.map((alt, index) => (
        <div
          key={alt.id}
          className={`flex flex-col gap-3 rounded-[18px] border p-3 transition-all ${
            alt.is_correct
              ? 'border-[var(--teal)] bg-[rgba(160,243,212,0.1)] shadow-sm'
              : 'border-[color:var(--line)] bg-white/72 hover:border-[color:var(--muted)]'
          }`}
        >
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer select-none text-[var(--muted)]">
              <span className="relative inline-flex h-5 w-5 items-center justify-center">
                <input
                  type="radio"
                  name="correct-alternative"
                  checked={alt.is_correct}
                  onChange={() => setCorrect(index)}
                  data-testid={`correct-${index}`}
                  className="absolute inset-0 m-0 cursor-pointer appearance-none opacity-0"
                />
                <span
                  aria-hidden="true"
                  className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    alt.is_correct
                      ? 'border-[var(--teal)] bg-[var(--teal)] text-white'
                      : 'border-[var(--line)] bg-white hover:border-[color:var(--muted)]'
                  }`}
                >
                  {alt.is_correct && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </span>
              </span>
              <span className={alt.is_correct ? 'text-[var(--teal)] font-bold' : ''}>
                {labelForIndex(index)}
              </span>
            </label>
            <input
              type="text"
              placeholder="Texto da alternativa"
              value={alt.text}
              onChange={(e) => update(index, { text: e.target.value })}
              data-testid={`alt-text-${index}`}
              className="aprova-field min-w-0 flex-1 py-2.5 text-sm"
            />
            <button
              type="button"
              onClick={() => remove(index)}
              aria-label="Remover alternativa"
              className="rounded-full p-2 text-[var(--muted)] transition hover:bg-[var(--danger-bg)] hover:text-[var(--danger)]"
            >
              <Trash2 size={16} />
            </button>
          </div>
          <input
            type="text"
            placeholder="Comentário da alternativa (opcional)"
            value={alt.alternative_comment}
            onChange={(e) => update(index, { alternative_comment: e.target.value })}
            className="aprova-field bg-[var(--surface-paper)] py-2.5 text-xs"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        data-testid="add-alternative"
        className="flex items-center justify-center gap-2 rounded-[18px] border border-dashed border-[rgba(0,84,64,0.34)] px-4 py-3 text-sm font-semibold text-[var(--teal)] transition hover:bg-[rgba(160,243,212,0.24)]"
      >
        <Plus size={16} /> Adicionar alternativa
      </button>
    </div>
  )
}
