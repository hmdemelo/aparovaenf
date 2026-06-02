import type { NextRequest } from 'next/server'
import { ok, fail, ErrorCodes } from '@/lib/api/response'
import { resolveAuthorContext } from '@/features/authors/author-context'
import { publishQuestion } from '@/features/authors/author-question-service'

export const dynamic = 'force-dynamic'

// POST /api/author/questions/:id/publish — publish a valid owned question.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await resolveAuthorContext()
  if (!ctx.ok) {
    return ctx.code === 'unauthenticated'
      ? fail(ErrorCodes.UNAUTHENTICATED, 'Authentication required')
      : fail(ErrorCodes.FORBIDDEN, 'Author access required')
  }
  const { id } = await params

  const result = await publishQuestion(ctx.db, ctx.authorId, id)
  if (!result.ok) {
    if (result.code === 'forbidden') {
      return fail(ErrorCodes.FORBIDDEN, 'You cannot publish this question')
    }
    if (result.code === 'not_found') {
      return fail(ErrorCodes.NOT_FOUND, 'Question not found')
    }
    // Validation failures: report every missing requirement.
    return fail(ErrorCodes.VALIDATION, result.errors.join('; '))
  }
  return ok(result.data)
}
