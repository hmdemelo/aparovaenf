import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { adminAuthFail } from '@/lib/api/admin-guard'
import { ErrorCodes, fail, ok } from '@/lib/api/response'
import { resolveAdminContext } from '@/features/admin/admin-permissions'
import { deleteAuthor, updateAuthorProfile } from '@/features/admin/admin-service'
import { createSupabaseServiceClient } from '@/lib/db/server'
import {
  updateAuthorProfileInputSchema,
  uuidSchema,
} from '@/lib/validation/schemas'

export const dynamic = 'force-dynamic'

const deleteAuthorSchema = z
  .object({
    transferToAuthorId: z.string().uuid().optional(),
    deleteQuestions: z.boolean().optional(),
  })
  .default({})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await resolveAdminContext()
  if (!ctx.ok) return adminAuthFail(ctx.code)

  const { id } = await params
  if (!uuidSchema.safeParse(id).success) {
    return fail(ErrorCodes.VALIDATION, 'Autor inválido')
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail(ErrorCodes.VALIDATION, 'Corpo da requisição inválido')
  }

  const parsed = updateAuthorProfileInputSchema.safeParse(body)
  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => issue.message).join('; ')
    return fail(ErrorCodes.VALIDATION, message)
  }

  const result = await updateAuthorProfile(ctx.db, id, parsed.data)
  if (!result.ok) {
    return result.code === 'not_found'
      ? fail(ErrorCodes.NOT_FOUND, 'Autor não encontrado')
      : fail(ErrorCodes.INTERNAL, result.message)
  }

  return ok({ author: result.author })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await resolveAdminContext()
  if (!ctx.ok) return adminAuthFail(ctx.code)

  const { id } = await params
  if (!uuidSchema.safeParse(id).success) {
    return fail(ErrorCodes.VALIDATION, 'Autor inválido')
  }

  let body: unknown = {}
  try {
    const text = await request.text()
    if (text) body = JSON.parse(text)
  } catch {
    return fail(ErrorCodes.VALIDATION, 'Corpo da requisição inválido')
  }

  const parsed = deleteAuthorSchema.safeParse(body)
  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => issue.message).join('; ')
    return fail(ErrorCodes.VALIDATION, message)
  }

  const service = createSupabaseServiceClient()
  const result = await deleteAuthor(service, id, parsed.data)
  if (!result.ok) {
    if (result.code === 'not_found') {
      return fail(ErrorCodes.NOT_FOUND, 'Autor não encontrado')
    }
    if (
      result.code === 'active_subscription' ||
      result.code === 'has_questions' ||
      result.code === 'invalid_transfer'
    ) {
      return fail(ErrorCodes.CONFLICT, result.message)
    }
    return fail(ErrorCodes.INTERNAL, 'Não foi possível deletar o autor.')
  }

  return ok({ success: true })
}
