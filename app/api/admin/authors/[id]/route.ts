import type { NextRequest } from 'next/server'
import { adminAuthFail } from '@/lib/api/admin-guard'
import { ErrorCodes, fail, ok } from '@/lib/api/response'
import { resolveAdminContext } from '@/features/admin/admin-permissions'
import { updateAuthorProfile } from '@/features/admin/admin-service'
import {
  updateAuthorProfileInputSchema,
  uuidSchema,
} from '@/lib/validation/schemas'

export const dynamic = 'force-dynamic'

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
