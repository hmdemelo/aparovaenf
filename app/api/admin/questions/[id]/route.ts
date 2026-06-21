import type { NextRequest } from 'next/server'
import { ok, fail, ErrorCodes } from '@/lib/api/response'
import { adminAuthFail } from '@/lib/api/admin-guard'
import { resolveAdminContext } from '@/features/admin/admin-permissions'
import { deleteQuestion } from '@/features/admin/admin-service'

export const dynamic = 'force-dynamic'

// DELETE /api/admin/questions/:id — remove a non-published question (pool draft
// awaiting review). Published questions must be unpublished first.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await resolveAdminContext()
  if (!ctx.ok) return adminAuthFail(ctx.code)

  const { id } = await params
  const result = await deleteQuestion(ctx.db, id)
  if (!result.ok) {
    if (result.code === 'not_found') {
      return fail(ErrorCodes.NOT_FOUND, 'Question not found')
    }
    if (result.code === 'published' || result.code === 'has_answers') {
      return fail(ErrorCodes.VALIDATION, result.message)
    }
    return fail(ErrorCodes.INTERNAL, result.message)
  }
  return ok({ deleted: true })
}
