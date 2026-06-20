import type { NextRequest } from 'next/server'
import { ok, fail, ErrorCodes } from '@/lib/api/response'
import { resolveAuthorContext } from '@/features/authors/author-context'
import { claimQuestion } from '@/features/authors/author-question-service'

export const dynamic = 'force-dynamic'

// POST /api/author/questions/:id/claim — claim a shared question from the pool.
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

  const result = await claimQuestion(ctx.db, ctx.authorId, id)
  if (!result.ok) {
    if (result.code === 'forbidden') {
      return fail(ErrorCodes.FORBIDDEN, result.errors.join('; '))
    }
    if (result.code === 'not_found') {
      return fail(ErrorCodes.NOT_FOUND, 'Question not found')
    }
    return fail(ErrorCodes.INTERNAL, result.errors.join('; '))
  }

  return ok(result.data)
}
