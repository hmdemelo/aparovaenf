'use client'

import { Plus, Trash2 } from 'lucide-react'

export type EditableAlternative = {
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
      { text: '', is_correct: false, alternative_comment: '' },
    ])
  }

  function remove(index: number) {
    onChange(alternatives.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-slate-700">Alternativas</p>
      {alternatives.map((alt, index) => (
        <div
          key={index}
          className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3"
        >
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <input
                type="radio"
                name="correct-alternative"
                checked={alt.is_correct}
                onChange={() => setCorrect(index)}
                data-testid={`correct-${index}`}
              />
              {labelForIndex(index)}
            </label>
            <input
              type="text"
              placeholder="Texto da alternativa"
              value={alt.text}
              onChange={(e) => update(index, { text: e.target.value })}
              data-testid={`alt-text-${index}`}
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => remove(index)}
              aria-label="Remover alternativa"
              className="text-slate-400 hover:text-rose-500"
            >
              <Trash2 size={16} />
            </button>
          </div>
          <input
            type="text"
            placeholder="Comentário da alternativa (opcional)"
            value={alt.alternative_comment}
            onChange={(e) => update(index, { alternative_comment: e.target.value })}
            className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        data-testid="add-alternative"
        className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-300 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
      >
        <Plus size={16} /> Adicionar alternativa
      </button>
    </div>
  )
}
