import type { NextRequest } from 'next/server'
import { ok, fail, ErrorCodes } from '@/lib/api/response'
import { authorQuestionInputSchema } from '@/lib/validation/schemas'
import { resolveAuthorContext } from '@/features/authors/author-context'
import {
  createDraftQuestion,
  listAuthorQuestions,
} from '@/features/authors/author-question-service'

export const dynamic = 'force-dynamic'

function authFail(code: 'unauthenticated' | 'forbidden') {
  return code === 'unauthenticated'
    ? fail(ErrorCodes.UNAUTHENTICATED, 'Authentication required')
    : fail(ErrorCodes.FORBIDDEN, 'Author access required')
}

// GET /api/author/questions — list the authenticated author's questions.
export async function GET() {
  const ctx = await resolveAuthorContext()
  if (!ctx.ok) return authFail(ctx.code)
  const questions = await listAuthorQuestions(ctx.db, ctx.authorId)
  return ok({ questions })
}

// POST /api/author/questions — create a draft question.
export async function POST(request: NextRequest) {
  const ctx = await resolveAuthorContext()
  if (!ctx.ok) return authFail(ctx.code)

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

  const result = await createDraftQuestion(ctx.db, ctx.authorId, parsed.data)
  if (!result.ok) {
    return fail(ErrorCodes.INTERNAL, result.errors.join('; '))
  }
  return ok(result.data, { status: 201 })
}
