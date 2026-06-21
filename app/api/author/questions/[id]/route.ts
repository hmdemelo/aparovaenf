import type { NextRequest } from 'next/server'
import { ok, fail, ErrorCodes } from '@/lib/api/response'
import { authorQuestionInputSchema } from '@/lib/validation/schemas'
import { resolveAuthorContext } from '@/features/authors/author-context'
import {
  deleteAuthorQuestion,
  getAuthorQuestion,
  updateQuestion,
} from '@/features/authors/author-question-service'

export const dynamic = 'force-dynamic'

function authFail(code: 'unauthenticated' | 'forbidden') {
  return code === 'unauthenticated'
    ? fail(ErrorCodes.UNAUTHENTICATED, 'Authentication required')
    : fail(ErrorCodes.FORBIDDEN, 'Author access required')
}

// GET /api/author/questions/:id — load one owned question for editing.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await resolveAuthorContext()
  if (!ctx.ok) return authFail(ctx.code)
  const { id } = await params
  const question = await getAuthorQuestion(ctx.db, ctx.authorId, id)
  if (!question) return fail(ErrorCodes.NOT_FOUND, 'Question not found')
  return ok({ question })
}

// PATCH /api/author/questions/:id — edit an owned question.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await resolveAuthorContext()
  if (!ctx.ok) return authFail(ctx.code)
  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail(ErrorCodes.VALIDATION, 'Invalid JSON body')
  }
  const parsed = authorQuestionInputSchema.safeParse(body)
  if (!parsed.success) {
    return fail(ErrorCodes.VALIDATION, parsed.error.issues[0]?.message ?? 'Invalid input')
  }

  const result = await updateQuestion(ctx.db, ctx.authorId, id, parsed.data)
  if (!result.ok) {
    if (result.code === 'forbidden') {
      return fail(ErrorCodes.FORBIDDEN, 'You cannot edit this question')
    }
    return fail(ErrorCodes.INTERNAL, result.errors.join('; '))
  }
  return ok(result.data)
}

// DELETE /api/author/questions/:id — remove an owned, not-yet-published question.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await resolveAuthorContext()
  if (!ctx.ok) return authFail(ctx.code)
  const { id } = await params

  const result = await deleteAuthorQuestion(ctx.db, ctx.authorId, id)
  if (!result.ok) {
    const message = result.errors.join('; ')
    if (result.code === 'not_found') return fail(ErrorCodes.NOT_FOUND, message)
    if (result.code === 'forbidden') return fail(ErrorCodes.FORBIDDEN, message)
    if (result.code === 'validation') return fail(ErrorCodes.VALIDATION, message)
    return fail(ErrorCodes.INTERNAL, message)
  }
  return ok(result.data)
}
