import type { NextRequest } from 'next/server'
import { ok, fail, ErrorCodes } from '@/lib/api/response'
import { topicsQuerySchema, createTopicInputSchema } from '@/lib/validation/schemas'
import {
  resolveCatalogContext,
  listTopics,
  createTopic
} from '@/features/authors/classification-catalog-service'

export const dynamic = 'force-dynamic'

function authFail(code: 'unauthenticated' | 'forbidden') {
  return code === 'unauthenticated'
    ? fail(ErrorCodes.UNAUTHENTICATED, 'Faça login para acessar o catálogo.')
    : fail(ErrorCodes.FORBIDDEN, 'Acesso restrito a autores e administradores.')
}

// GET /api/author/topics
export async function GET(request: NextRequest) {
  const ctx = await resolveCatalogContext()
  if (!ctx.ok) return authFail(ctx.code)

  const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries())
  const parsed = topicsQuerySchema.safeParse(searchParams)
  if (!parsed.success) {
    return fail(ErrorCodes.VALIDATION, parsed.error.issues[0]?.message ?? 'Parâmetros de consulta inválidos.')
  }

  try {
    const data = await listTopics(ctx.db, ctx.authorId, parsed.data)
    return ok(data)
  } catch (error) {
    console.error('Failed to list author topics', error)
    return fail(ErrorCodes.INTERNAL, 'Não foi possível carregar os assuntos.')
  }
}

// POST /api/author/topics
export async function POST(request: NextRequest) {
  const ctx = await resolveCatalogContext()
  if (!ctx.ok) return authFail(ctx.code)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail(ErrorCodes.VALIDATION, 'Corpo JSON inválido.')
  }

  const parsed = createTopicInputSchema.safeParse(body)
  if (!parsed.success) {
    return fail(ErrorCodes.VALIDATION, parsed.error.issues[0]?.message ?? 'Dados inválidos.')
  }

  const result = await createTopic(ctx.db, ctx, parsed.data)
  if (!result.ok) {
    return fail(ErrorCodes.INTERNAL, result.errors.join('; '))
  }

  const status = result.data.created ? 201 : 200
  return ok(result.data, { status })
}
