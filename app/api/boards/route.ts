import type { NextRequest } from 'next/server'
import { ok, fail, ErrorCodes } from '@/lib/api/response'
import { createBoardInputSchema } from '@/lib/validation/schemas'
import { resolveAuthorContext } from '@/features/authors/author-context'
import { createBoardInline } from '@/features/authors/author-question-service'

export const dynamic = 'force-dynamic'

// POST /api/boards — inline board quick-add from the author question editor.
// Restricted to authenticated authors/admins (RLS + resolveAuthorContext).
export async function POST(request: NextRequest) {
  const ctx = await resolveAuthorContext()
  if (!ctx.ok) {
    return ctx.code === 'unauthenticated'
      ? fail(ErrorCodes.UNAUTHENTICATED, 'Faça login para cadastrar uma banca.')
      : fail(ErrorCodes.FORBIDDEN, 'Acesso restrito a autores e administradores.')
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail(ErrorCodes.VALIDATION, 'Corpo JSON inválido.')
  }
  const parsed = createBoardInputSchema.safeParse(body)
  if (!parsed.success) {
    return fail(ErrorCodes.VALIDATION, parsed.error.issues[0]?.message ?? 'Dados inválidos.')
  }

  const result = await createBoardInline(ctx.db, parsed.data.name, ctx.authorId)
  if (!result.ok) {
    const code = result.code === 'validation' ? ErrorCodes.VALIDATION : ErrorCodes.INTERNAL
    return fail(code, result.errors.join('; '))
  }
  return ok(result.data, { status: 201 })
}
