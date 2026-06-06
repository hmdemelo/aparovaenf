import { describe, expect, it, vi } from 'vitest'
import { createDraftQuestion } from '@/features/authors/author-question-service'

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
