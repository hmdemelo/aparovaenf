import type { NextRequest } from 'next/server'
import { ok, fail, ErrorCodes } from '@/lib/api/response'
import { disciplinesQuerySchema, createDisciplineInputSchema } from '@/lib/validation/schemas'
import {
  resolveCatalogContext,
  listDisciplines,
  createDiscipline
} from '@/features/authors/classification-catalog-service'

export const dynamic = 'force-dynamic'

function authFail(code: 'unauthenticated' | 'forbidden') {
  return code === 'unauthenticated'
    ? fail(ErrorCodes.UNAUTHENTICATED, 'Faça login para acessar o catálogo.')
    : fail(ErrorCodes.FORBIDDEN, 'Acesso restrito a autores e administradores.')
}

// GET /api/author/disciplines
export async function GET(request: NextRequest) {
  const ctx = await resolveCatalogContext()
  if (!ctx.ok) return authFail(ctx.code)

  const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries())
  const parsed = disciplinesQuerySchema.safeParse(searchParams)
  if (!parsed.success) {
    return fail(ErrorCodes.VALIDATION, parsed.error.issues[0]?.message ?? 'Parâmetros de consulta inválidos.')
  }

  try {
    const data = await listDisciplines(ctx.db, ctx.authorId, parsed.data)
    return ok(data)
  } catch (error) {
    console.error('Failed to list author disciplines', error)
    return fail(ErrorCodes.INTERNAL, 'Não foi possível carregar as disciplinas.')
  }
}

// POST /api/author/disciplines
export async function POST(request: NextRequest) {
  const ctx = await resolveCatalogContext()
  if (!ctx.ok) return authFail(ctx.code)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail(ErrorCodes.VALIDATION, 'Corpo JSON inválido.')
  }

  const parsed = createDisciplineInputSchema.safeParse(body)
  if (!parsed.success) {
    return fail(ErrorCodes.VALIDATION, parsed.error.issues[0]?.message ?? 'Dados inválidos.')
  }

  const result = await createDiscipline(ctx.db, ctx, parsed.data)
  if (!result.ok) {
    return fail(ErrorCodes.INTERNAL, result.errors.join('; '))
  }

  const status = result.data.created ? 201 : 200
  return ok(result.data, { status })
}
