import type { NextRequest } from 'next/server'
import { ok, fail, ErrorCodes } from '@/lib/api/response'
import { adminAuthFail } from '@/lib/api/admin-guard'
import { resolveAdminContext } from '@/features/admin/admin-permissions'
import { unpublishQuestion } from '@/features/admin/admin-service'

export const dynamic = 'force-dynamic'

// POST /api/admin/questions/:id/unpublish — remove from feed eligibility.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await resolveAdminContext()
  if (!ctx.ok) return adminAuthFail(ctx.code)

  const { id } = await params
  const result = await unpublishQuestion(ctx.db, id)
  if (!result.ok) {
    return result.code === 'not_found'
      ? fail(ErrorCodes.NOT_FOUND, 'Question not found')
      : fail(ErrorCodes.INTERNAL, result.message)
  }
  return ok({ unpublished: true })
}
