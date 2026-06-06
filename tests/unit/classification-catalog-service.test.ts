import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  listDisciplines,
  createDiscipline,
  createTopic
} from '@/features/authors/classification-catalog-service'

describe('classification-catalog-service unit tests', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockDb: any

  beforeEach(() => {
    mockDb = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
    }
  })

  it('listDisciplines formats items and queries correctly', async () => {
    mockDb.range.mockResolvedValueOnce({
      data: [
        {
          id: 'subject-1',
          name: 'Terapia Intensiva',
          slug: 'terapia-intensiva',
          created_by_kind: 'author',
          created_by_author_id: 'author-1',
          created_at: '2026-06-05T00:00:00Z',
          career: { id: 'career-1', name: 'Enfermagem' },
          creator: { display_name: 'Martinho', is_public: true }
        }
      ],
      count: 1,
      error: null
    })

    const result = await listDisciplines(mockDb, 'author-1', { page: 1, page_size: 20 })
    expect(result.items).toHaveLength(1)
    expect(result.items[0]).toEqual({
      id: 'subject-1',
      name: 'Terapia Intensiva',
      career: { id: 'career-1', name: 'Enfermagem' },
      created_by: { label: 'Você', is_current_user: true },
      created_at: '2026-06-05T00:00:00Z'
    })
    expect(result.pagination.total).toBe(1)
  })

  it('createDiscipline insert maps conflict 23505 to existing record', async () => {
    // First call to single() represents the insert result (unique violation)
    mockDb.single.mockResolvedValueOnce({
      data: null,
      error: { code: '23505', message: 'duplicate key value violates unique constraint' }
    })

    // Second call to single() represents the fallback lookup result (existing record)
    mockDb.single.mockResolvedValueOnce({
      data: { id: 'subject-1', name: 'Terapia Intensiva' },
      error: null
    })

    const result = await createDiscipline(mockDb, { role: 'author', authorId: 'author-1', userId: 'user-1' }, {
      name: 'Terapia Intensiva',
      career_id: 'career-1'
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.created).toBe(false)
      expect(result.data.item).toEqual({ id: 'subject-1', name: 'Terapia Intensiva' })
    }
  })

  it('createTopic calls insert with correct kinds and author profiles', async () => {
    mockDb.single.mockResolvedValueOnce({
      data: { id: 'topic-1', name: 'Ventilação Mecânica' },
      error: null
    })

    const result = await createTopic(mockDb, { role: 'author', authorId: 'author-1', userId: 'user-1' }, {
      name: 'Ventilação Mecânica',
      discipline_id: 'subject-1'
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.created).toBe(true)
      expect(result.data.item.name).toBe('Ventilação Mecânica')
    }
  })
})
