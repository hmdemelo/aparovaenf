import { describe, expect, it, vi } from 'vitest'

vi.mock('@/features/admin/admin-permissions', () => ({
  resolveAdminContext: vi.fn(async () => ({
    ok: true,
    db: {},
    userId: '00000000-0000-0000-0000-0000000000ad',
  })),
}))

describe('GET /api/admin/questions/bulk-template', () => {
  it('returns the CSV template for admins', async () => {
    const { GET } = await import('@/app/api/admin/questions/bulk-template/route')

    const response = await GET()
    const text = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/csv')
    expect(text).toContain('career;subject;difficulty;statement')
  })
})
