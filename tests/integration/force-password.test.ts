import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  createSupabaseServerClient: vi.fn(),
  createSupabaseServiceClient: vi.fn(),
  updateUser: vi.fn(),
  profileUpdate: vi.fn(),
}))

vi.mock('@/lib/auth/roles', () => ({
  getCurrentUser: mocks.getCurrentUser,
}))

vi.mock('@/lib/db/server', () => ({
  createSupabaseServerClient: mocks.createSupabaseServerClient,
  createSupabaseServiceClient: mocks.createSupabaseServiceClient,
}))

function request(body: unknown) {
  return new NextRequest('http://localhost/api/auth/force-password', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function validPasswordInput() {
  return 'example-pass-123'
}

describe('POST /api/auth/force-password', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    mocks.getCurrentUser.mockResolvedValue({
      id: '00000000-0000-0000-0000-0000000000a4',
      role: 'student',
      forcePasswordChange: true,
    })
    mocks.updateUser.mockResolvedValue({ error: null })
    mocks.profileUpdate.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })
    mocks.createSupabaseServerClient.mockResolvedValue({
      auth: { updateUser: mocks.updateUser },
    })
    mocks.createSupabaseServiceClient.mockReturnValue({
      from: vi.fn(() => ({ update: mocks.profileUpdate })),
    })
  })

  it('updates the password and only then clears the forced-change flag', async () => {
    const { POST } = await import('@/app/api/auth/force-password/route')
    const response = await POST(request({ password: validPasswordInput() }))

    expect(response.status).toBe(200)
    expect(mocks.updateUser).toHaveBeenCalledWith({
      password: validPasswordInput(),
    })
    expect(mocks.profileUpdate).toHaveBeenCalledWith({
      force_password_change: false,
    })
  })

  it('rejects users who do not have a forced password change pending', async () => {
    mocks.getCurrentUser.mockResolvedValue({
      id: '00000000-0000-0000-0000-0000000000a4',
      role: 'student',
      forcePasswordChange: false,
    })

    const { POST } = await import('@/app/api/auth/force-password/route')
    const response = await POST(request({ password: validPasswordInput() }))

    expect(response.status).toBe(403)
    expect(mocks.updateUser).not.toHaveBeenCalled()
  })

  it('keeps the flag set when changing the auth password fails', async () => {
    mocks.updateUser.mockResolvedValue({ error: { message: 'weak password' } })

    const { POST } = await import('@/app/api/auth/force-password/route')
    const response = await POST(request({ password: validPasswordInput() }))

    expect(response.status).toBe(422)
    expect(mocks.profileUpdate).not.toHaveBeenCalled()
  })
})
