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
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
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

  it('looks up a duplicate topic only inside the requested discipline', async () => {
    mockDb.single.mockResolvedValueOnce({
      data: null,
      error: { code: '23505', message: 'duplicate key' }
    })
    mockDb.maybeSingle.mockResolvedValueOnce({
      data: { id: 'topic-1', name: 'Imunização' },
      error: null
    })

    const result = await createTopic(mockDb, {
      role: 'author',
      authorId: 'author-1',
      userId: 'user-1'
    }, {
      name: 'Imunização',
      discipline_id: 'subject-1'
    })

    expect(result.ok).toBe(true)
    expect(mockDb.eq).toHaveBeenCalledWith('subject_id', 'subject-1')
    expect(mockDb.eq).toHaveBeenCalledWith('slug', 'imunizacao')
  })

  describe('update and delete catalog items', () => {
    it('updateDiscipline updates database fields and returns success', async () => {
      mockDb.maybeSingle.mockResolvedValueOnce({
        data: { id: 'disc-1', name: 'Novo Nome' },
        error: null,
      })

      const { updateDiscipline } = await import('@/features/authors/classification-catalog-service')
      const result = await updateDiscipline(mockDb, 'disc-1', {
        name: 'Novo Nome',
        career_id: 'career-2',
      })

      expect(result.ok).toBe(true)
      expect(mockDb.update).toHaveBeenCalledWith(
        expect.objectContaining({ career_id: 'career-2' }),
      )
      if (result.ok) {
        expect(result.data.name).toBe('Novo Nome')
      }
    })

    it('deleteDiscipline blocks if questions are using it', async () => {
      // First Head Check: count of questions > 0
      mockDb.select.mockImplementation(() => ({
        eq: () => Promise.resolve({ count: 5, error: null }),
      }))

      const { deleteDiscipline } = await import('@/features/authors/classification-catalog-service')
      const result = await deleteDiscipline(mockDb, 'disc-1')

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.errors[0]).toContain('uso por questões')
      }
    })

    it('deleteDiscipline fails closed when dependency lookup fails', async () => {
      mockDb.select.mockImplementation(() => ({
        eq: () =>
          Promise.resolve({
            count: null,
            error: { message: 'database unavailable' },
          }),
      }))

      const { deleteDiscipline } = await import('@/features/authors/classification-catalog-service')
      const result = await deleteDiscipline(mockDb, 'disc-1')

      expect(result.ok).toBe(false)
      expect(mockDb.delete).not.toHaveBeenCalled()
    })

    it('deleteDiscipline blocks if topics are associated with it', async () => {
      // First Head Check (questions count = 0), Second Head Check (tags count = 2)
      let countCall = 0
      mockDb.select.mockImplementation(() => ({
        eq: () => {
          countCall++
          return Promise.resolve({ count: countCall === 1 ? 0 : 2, error: null })
        },
      }))

      const { deleteDiscipline } = await import('@/features/authors/classification-catalog-service')
      const result = await deleteDiscipline(mockDb, 'disc-1')

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.errors[0]).toContain('assuntos associados')
      }
    })

    it('deleteDiscipline deletes if it is unused', async () => {
      mockDb.select.mockImplementation(() => ({
        eq: () => Promise.resolve({ count: 0, error: null }),
      }))
      mockDb.delete = vi.fn().mockReturnValue({
        eq: () => Promise.resolve({ error: null }),
      })

      const { deleteDiscipline } = await import('@/features/authors/classification-catalog-service')
      const result = await deleteDiscipline(mockDb, 'disc-1')

      expect(result.ok).toBe(true)
    })

    it('deleteTopic blocks if associations exist', async () => {
      mockDb.select.mockImplementation(() => ({
        eq: () => Promise.resolve({ count: 3, error: null }),
      }))

      const { deleteTopic } = await import('@/features/authors/classification-catalog-service')
      const result = await deleteTopic(mockDb, 'topic-1')

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.errors[0]).toContain('uso por questões')
      }
    })

    it('deleteBoard blocks if associations exist', async () => {
      mockDb.select.mockImplementation(() => ({
        eq: () => Promise.resolve({ count: 1, error: null }),
      }))

      const { deleteBoard } = await import('@/features/authors/classification-catalog-service')
      const result = await deleteBoard(mockDb, 'board-1')

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.errors[0]).toContain('uso por questões')
      }
    })
  })
})
