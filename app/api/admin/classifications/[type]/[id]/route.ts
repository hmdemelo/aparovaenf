import type { NextRequest } from 'next/server'
import { ok, fail, ErrorCodes } from '@/lib/api/response'
import { adminAuthFail } from '@/lib/api/admin-guard'
import { resolveAdminContext } from '@/features/admin/admin-permissions'
import {
  type CatalogServiceResult,
  updateDiscipline,
  deleteDiscipline,
  updateTopic,
  deleteTopic,
  updateBoard,
  deleteBoard,
} from '@/features/authors/classification-catalog-service'
import {
  createBoardInputSchema,
  createDisciplineInputSchema,
  createTopicInputSchema,
  uuidSchema,
} from '@/lib/validation/schemas'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const paramsSchema = z.object({
  type: z.enum(['discipline', 'topic', 'board']),
  id: uuidSchema,
})

function catalogResult<T>(result: CatalogServiceResult<T>) {
  if (result.ok) return ok(result.data)
  if (result.code === 'not_found') {
    return fail(ErrorCodes.NOT_FOUND, result.errors.join('; '))
  }
  if (result.code === 'conflict') {
    return fail(ErrorCodes.CONFLICT, result.errors.join('; '))
  }
  return fail(ErrorCodes.INTERNAL, result.errors.join('; '))
}

// PUT /api/admin/classifications/[type]/[id] — Edit classification item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> },
) {
  const ctx = await resolveAdminContext()
  if (!ctx.ok) return adminAuthFail(ctx.code)

  const parsedParams = paramsSchema.safeParse(await params)
  if (!parsedParams.success) {
    return fail(ErrorCodes.VALIDATION, 'Classificação inválida.')
  }
  const { type, id } = parsedParams.data

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail(ErrorCodes.VALIDATION, 'Corpo da requisição inválido')
  }

  if (type === 'discipline') {
    const parsed = createDisciplineInputSchema.safeParse(body)
    if (!parsed.success) {
      return fail(ErrorCodes.VALIDATION, parsed.error.issues[0].message)
    }
    return catalogResult(await updateDiscipline(ctx.db, id, parsed.data))
  }

  if (type === 'topic') {
    const parsed = createTopicInputSchema.safeParse(body)
    if (!parsed.success) {
      return fail(ErrorCodes.VALIDATION, parsed.error.issues[0].message)
    }
    return catalogResult(await updateTopic(ctx.db, id, parsed.data))
  }

  const parsed = createBoardInputSchema.safeParse(body)
  if (!parsed.success) {
    return fail(ErrorCodes.VALIDATION, parsed.error.issues[0].message)
  }
  return catalogResult(await updateBoard(ctx.db, id, parsed.data))
}

// DELETE /api/admin/classifications/[type]/[id] — Delete classification item
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> },
) {
  const ctx = await resolveAdminContext()
  if (!ctx.ok) return adminAuthFail(ctx.code)

  const parsedParams = paramsSchema.safeParse(await params)
  if (!parsedParams.success) {
    return fail(ErrorCodes.VALIDATION, 'Classificação inválida.')
  }
  const { type, id } = parsedParams.data

  const result =
    type === 'discipline'
      ? await deleteDiscipline(ctx.db, id)
      : type === 'topic'
        ? await deleteTopic(ctx.db, id)
        : await deleteBoard(ctx.db, id)

  if (!result.ok) return catalogResult(result)
  return ok({ deleted: true })
}
