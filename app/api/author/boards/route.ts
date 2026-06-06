import type { NextRequest } from 'next/server'
import { ok, fail, ErrorCodes } from '@/lib/api/response'
import { catalogQuerySchema, createBoardInputSchema } from '@/lib/validation/schemas'
import {
  resolveCatalogContext,
  listBoards,
  createBoard
} from '@/features/authors/classification-catalog-service'

export const dynamic = 'force-dynamic'

function authFail(code: 'unauthenticated' | 'forbidden') {
  return code === 'unauthenticated'
    ? fail(ErrorCodes.UNAUTHENTICATED, 'Faça login para acessar o catálogo.')
    : fail(ErrorCodes.FORBIDDEN, 'Acesso restrito a autores e administradores.')
}

// GET /api/author/boards
export async function GET(request: NextRequest) {
  const ctx = await resolveCatalogContext()
  if (!ctx.ok) return authFail(ctx.code)

  const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries())
  const parsed = catalogQuerySchema.safeParse(searchParams)
  if (!parsed.success) {
    return fail(ErrorCodes.VALIDATION, parsed.error.issues[0]?.message ?? 'Parâmetros de consulta inválidos.')
  }

  try {
    const data = await listBoards(ctx.db, ctx.authorId, parsed.data)
    return ok(data)
  } catch (error) {
    console.error('Failed to list author boards', error)
    return fail(ErrorCodes.INTERNAL, 'Não foi possível carregar as bancas.')
  }
}

// POST /api/author/boards
export async function POST(request: NextRequest) {
  const ctx = await resolveCatalogContext()
  if (!ctx.ok) return authFail(ctx.code)

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

  const result = await createBoard(ctx.db, ctx, parsed.data)
  if (!result.ok) {
    return fail(ErrorCodes.INTERNAL, result.errors.join('; '))
  }

  const status = result.data.created ? 201 : 200
  return ok(result.data, { status })
}
