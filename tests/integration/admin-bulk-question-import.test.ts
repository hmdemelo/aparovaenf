import { describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/admin/authors/[id]/questions/bulk-import/route'
import type { NextRequest } from 'next/server'

vi.mock('@/features/admin/admin-permissions', () => ({
  resolveAdminContext: vi.fn(async () => ({
    ok: true,
    db: {},
    userId: '00000000-0000-0000-0000-0000000000ad',
  })),
}))

vi.mock('@/lib/db/server', () => ({
  createSupabaseServiceClient: vi.fn(() => ({})),
}))

vi.mock('@/features/admin/bulk-question-import-service', () => ({
  importBulkQuestionsForAuthor: vi.fn(async () => ({
    ok: true,
    author_id: '00000000-0000-0000-0000-000000000001',
    file_name: 'questoes.csv',
    total_rows: 1,
    imported: 1,
    failed: 0,
    created_question_ids: ['created-question-1'],
    errors: [],
  })),
}))

describe('POST /api/admin/authors/[id]/questions/bulk-import', () => {
  it('accepts a CSV multipart upload and returns the import summary', async () => {
    const formData = new FormData()
    formData.set(
      'file',
      new File(
        ['career;subject;difficulty;statement;alt_a;alt_b\nEnfermagem;SUS;facil;Q;A;B'],
        'questoes.csv',
        { type: 'text/csv' },
      ),
    )
    const request = { formData: async () => formData } as unknown as NextRequest

    const response = await POST(request, {
      params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000001' }),
    })
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.imported).toBe(1)
  })

  it('rejects non-CSV uploads before invoking the service', async () => {
    const formData = new FormData()
    formData.set('file', new File(['x'], 'questoes.txt', { type: 'text/plain' }))
    const request = { formData: async () => formData } as unknown as NextRequest

    const response = await POST(request, {
      params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000001' }),
    })
    const json = await response.json()

    expect(response.status).toBe(422)
    expect(json.success).toBe(false)
    expect(json.error.message).toContain('CSV')
  })
})
