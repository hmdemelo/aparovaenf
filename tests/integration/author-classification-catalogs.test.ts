import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ErrorCodes } from '@/lib/api/response'

const mocks = vi.hoisted(() => {
  const from = vi.fn()
  return {
    getCurrentUser: vi.fn(),
    createSupabaseServerClient: vi.fn(() => ({ from })),
    getAuthorProfileId: vi.fn(),
    from,
  }
})

vi.mock('@/lib/auth/roles', () => ({
  getCurrentUser: mocks.getCurrentUser,
}))

vi.mock('@/lib/db/server', () => ({
  createSupabaseServerClient: mocks.createSupabaseServerClient,
  createSupabaseServiceClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null })
    }))
  }))
}))

vi.mock('@/features/authors/author-permissions', () => ({
  getAuthorProfileId: mocks.getAuthorProfileId,
}))

describe('Author Classification Catalogs Routes Integration', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockQueryChain: any

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    mockQueryChain = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockReturnThis(),
    }

    mocks.from.mockReturnValue(mockQueryChain)
  })

  // GET Request helper
  function getRequest(url: string) {
    return new NextRequest(url, { method: 'GET' })
  }

  // POST Request helper
  function postRequest(url: string, body: unknown) {
    return new NextRequest(url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' },
    })
  }

  describe('GET /api/author/disciplines', () => {
    it('returns unauthenticated when user is missing', async () => {
      mocks.getCurrentUser.mockResolvedValue(null)
      const { GET } = await import('@/app/api/author/disciplines/route')

      const res = await GET(getRequest('http://localhost/api/author/disciplines'))
      const json = await res.json()

      expect(res.status).toBe(401)
      expect(json.success).toBe(false)
      expect(json.error.code).toBe(ErrorCodes.UNAUTHENTICATED)
    })

    it('returns forbidden when user role is student', async () => {
      mocks.getCurrentUser.mockResolvedValue({ id: 'user-1', role: 'student' })
      const { GET } = await import('@/app/api/author/disciplines/route')

      const res = await GET(getRequest('http://localhost/api/author/disciplines'))
      const json = await res.json()

      expect(res.status).toBe(403)
      expect(json.success).toBe(false)
      expect(json.error.code).toBe(ErrorCodes.FORBIDDEN)
    })

    it('returns disciplines list for authenticated author', async () => {
      mocks.getCurrentUser.mockResolvedValue({ id: 'user-1', role: 'author' })
      mocks.getAuthorProfileId.mockResolvedValue('author-1')

      mockQueryChain.range.mockResolvedValueOnce({
        data: [
          {
            id: 'sub-1',
            name: 'Saúde Mental',
            slug: 'saude-mental',
            created_by_kind: 'system',
            created_by_author_id: null,
            created_at: '2026-06-05T00:00:00Z',
            career: { id: 'car-1', name: 'Enfermagem' },
            creator: null
          }
        ],
        count: 1,
        error: null
      })

      const { GET } = await import('@/app/api/author/disciplines/route')
      const res = await GET(getRequest('http://localhost/api/author/disciplines?career_id=00000000-0000-0000-0000-0000000000c1'))
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.items).toHaveLength(1)
      expect(json.data.items[0].name).toBe('Saúde Mental')
      expect(json.data.items[0].created_by.label).toBe('Sistema')
      expect(json.data.items[0].career.name).toBe('Enfermagem')
    })
  })

  describe('POST /api/author/disciplines', () => {
    it('creates a new discipline successfully', async () => {
      mocks.getCurrentUser.mockResolvedValue({ id: 'user-1', role: 'author' })
      mocks.getAuthorProfileId.mockResolvedValue('author-1')

      // Insert mock resolving to new item
      mockQueryChain.single.mockResolvedValueOnce({
        data: { id: '00000000-0000-0000-0000-000000000001', name: 'Saúde Ocupacional' },
        error: null
      })

      const { POST } = await import('@/app/api/author/disciplines/route')
      const res = await POST(postRequest('http://localhost/api/author/disciplines', {
        name: 'Saúde Ocupacional',
        career_id: '00000000-0000-0000-0000-0000000000c1'
      }))
      const json = await res.json()

      expect(res.status).toBe(201)
      expect(json.success).toBe(true)
      expect(json.data.created).toBe(true)
      expect(json.data.item.name).toBe('Saúde Ocupacional')
    })

    it('returns conflict 200 with existing item when name already exists', async () => {
      mocks.getCurrentUser.mockResolvedValue({ id: 'user-1', role: 'author' })
      mocks.getAuthorProfileId.mockResolvedValue('author-1')

      // Insert mock fails with duplicate key error
      mockQueryChain.single.mockResolvedValueOnce({
        data: null,
        error: { code: '23505', message: 'duplicate key' }
      })

      // Fallback lookup mock returns the existing item
      mockQueryChain.single.mockResolvedValueOnce({
        data: { id: '00000000-0000-0000-0000-000000000002', name: 'Saúde Mental' },
        error: null
      })

      const { POST } = await import('@/app/api/author/disciplines/route')
      const res = await POST(postRequest('http://localhost/api/author/disciplines', {
        name: 'Saúde Mental',
        career_id: '00000000-0000-0000-0000-0000000000c1'
      }))
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.created).toBe(false)
      expect(json.data.item.id).toBe('00000000-0000-0000-0000-000000000002')
    })
  })
})
