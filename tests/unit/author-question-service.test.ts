import { describe, expect, it, vi } from 'vitest'
import {
  createDraftQuestion,
  deleteAuthorQuestion,
} from '@/features/authors/author-question-service'

type QuestionRow = {
  id: string
  author_id: string | null
  status: string
  image_path: string | null
}

function buildDeleteDb(options: {
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

describe('author-question-service topic validation', () => {
  it('saves an unclassified draft when topic_ids is empty', async () => {
    const questionInsert = vi.fn().mockReturnThis()
    const questionSelect = vi.fn().mockReturnThis()
    const questionSingle = vi.fn().mockResolvedValue({
      data: { id: 'question-1' },
      error: null,
    })
    const questionTagsDelete = vi.fn().mockReturnThis()
    const questionTagsEq = vi.fn().mockResolvedValue({ error: null })

    const db = {
      from: vi.fn((table: string) => {
        if (table === 'questions') {
          return {
            insert: questionInsert,
            select: questionSelect,
            single: questionSingle,
          }
        }
        if (table === 'question_tags') {
          return {
            delete: questionTagsDelete,
            eq: questionTagsEq,
          }
        }
        throw new Error(`Unexpected table: ${table}`)
      }),
    }

    const result = await createDraftQuestion(db as never, 'author-1', {
      source_type: 'autoral',
      statement: 'Rascunho ainda sem classificação',
      topic_ids: [],
    })

    expect(result).toEqual({ ok: true, data: { id: 'question-1' } })
    expect(questionInsert).toHaveBeenCalledOnce()
  })

  it('validates topic ids before inserting the question', async () => {
    const questionInsert = vi.fn()
    const tagsSelect = vi.fn().mockReturnThis()
    const tagsIn = vi.fn().mockResolvedValue({ data: [], error: null })

    const db = {
      from: vi.fn((table: string) => {
        if (table === 'tags') {
          return {
            select: tagsSelect,
            in: tagsIn,
          }
        }
        if (table === 'questions') {
          return { insert: questionInsert }
        }
        throw new Error(`Unexpected table: ${table}`)
      }),
    }

    const result = await createDraftQuestion(db as never, 'author-1', {
      subject_id: '00000000-0000-0000-0000-000000000001',
      source_type: 'autoral',
      statement: 'Questão com assunto inválido',
      topic_ids: ['00000000-0000-0000-0000-000000000002'],
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.code).toBe('validation')
    }
    expect(questionInsert).not.toHaveBeenCalled()
  })
})

describe('deleteAuthorQuestion', () => {
  it('deletes an owned draft and removes its image', async () => {
    const eqSpy = vi.fn().mockResolvedValue({ error: null })
    const deleteSpy = vi.fn(() => ({ eq: eqSpy }))
    const storageRemove = vi.fn().mockResolvedValue({ error: null })
    const db = buildDeleteDb({
      question: {
        id: 'q-1',
        author_id: 'author-1',
        status: 'draft',
        image_path: 'author-1/img.png',
      },
      answerCount: 0,
      deleteSpy,
      storageRemove,
    })

    const result = await deleteAuthorQuestion(db as never, 'author-1', 'q-1')

    expect(result).toEqual({ ok: true, data: { id: 'q-1' } })
    expect(deleteSpy).toHaveBeenCalledOnce()
    expect(storageRemove).toHaveBeenCalledWith(['author-1/img.png'])
  })

  it('returns not_found when the question does not exist', async () => {
    const db = buildDeleteDb({ question: null })
    const result = await deleteAuthorQuestion(db as never, 'author-1', 'q-x')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('not_found')
  })

  it('forbids deleting a question owned by another author', async () => {
    const db = buildDeleteDb({
      question: { id: 'q-1', author_id: 'author-2', status: 'draft', image_path: null },
    })
    const result = await deleteAuthorQuestion(db as never, 'author-1', 'q-1')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('forbidden')
  })

  it('forbids deleting a published question', async () => {
    const db = buildDeleteDb({
      question: {
        id: 'q-1',
        author_id: 'author-1',
        status: 'published',
        image_path: null,
      },
    })
    const result = await deleteAuthorQuestion(db as never, 'author-1', 'q-1')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('forbidden')
  })

  it('blocks deletion when the question already has answers', async () => {
    const deleteSpy = vi.fn()
    const db = buildDeleteDb({
      question: { id: 'q-1', author_id: 'author-1', status: 'draft', image_path: null },
      answerCount: 3,
      deleteSpy,
    })
    const result = await deleteAuthorQuestion(db as never, 'author-1', 'q-1')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('validation')
    expect(deleteSpy).not.toHaveBeenCalled()
  })
})
