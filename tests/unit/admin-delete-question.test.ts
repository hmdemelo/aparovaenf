import { describe, expect, it, vi } from 'vitest'
import { deleteQuestion } from '@/features/admin/admin-service'

type QuestionRow = {
  id: string
  status: string
  image_path: string | null
}

function buildDb(options: {
  question: QuestionRow | null
  answerCount?: number
  storageRemove?: ReturnType<typeof vi.fn>
  deleteSpy?: ReturnType<typeof vi.fn>
}) {
  const deleteSpy =
    options.deleteSpy ??
    vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) }))

  return {
    from: vi.fn((table: string) => {
      if (table === 'questions') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi
                .fn()
                .mockResolvedValue({ data: options.question, error: null }),
            })),
          })),
          delete: deleteSpy,
        }
      }
      if (table === 'answer_attempts') {
        return {
          select: vi.fn(() => ({
            eq: vi
              .fn()
              .mockResolvedValue({ count: options.answerCount ?? 0, error: null }),
          })),
        }
      }
      throw new Error(`Unexpected table: ${table}`)
    }),
    storage: {
      from: vi.fn(() => ({
        remove: options.storageRemove ?? vi.fn().mockResolvedValue({ error: null }),
      })),
    },
  }
}

describe('admin deleteQuestion', () => {
  it('deletes a non-published question and removes its image', async () => {
    const eqSpy = vi.fn().mockResolvedValue({ error: null })
    const deleteSpy = vi.fn(() => ({ eq: eqSpy }))
    const storageRemove = vi.fn().mockResolvedValue({ error: null })
    const db = buildDb({
      question: { id: 'q-1', status: 'draft', image_path: 'pool/img.png' },
      answerCount: 0,
      deleteSpy,
      storageRemove,
    })

    const result = await deleteQuestion(db as never, 'q-1')

    expect(result).toEqual({ ok: true })
    expect(deleteSpy).toHaveBeenCalledOnce()
    expect(storageRemove).toHaveBeenCalledWith(['pool/img.png'])
  })

  it('returns not_found when the question does not exist', async () => {
    const db = buildDb({ question: null })
    const result = await deleteQuestion(db as never, 'q-x')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('not_found')
  })

  it('blocks deleting a published question', async () => {
    const deleteSpy = vi.fn()
    const db = buildDb({
      question: { id: 'q-1', status: 'published', image_path: null },
      deleteSpy,
    })
    const result = await deleteQuestion(db as never, 'q-1')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('published')
    expect(deleteSpy).not.toHaveBeenCalled()
  })

  it('blocks deletion when the question already has answers', async () => {
    const deleteSpy = vi.fn()
    const db = buildDb({
      question: { id: 'q-1', status: 'draft', image_path: null },
      answerCount: 5,
      deleteSpy,
    })
    const result = await deleteQuestion(db as never, 'q-1')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('has_answers')
    expect(deleteSpy).not.toHaveBeenCalled()
  })
})
