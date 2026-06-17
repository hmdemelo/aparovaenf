import type { NextRequest } from 'next/server'
import { adminAuthFail } from '@/lib/api/admin-guard'
import { ErrorCodes, fail, ok } from '@/lib/api/response'
import { resolveAdminContext } from '@/features/admin/admin-permissions'
import { deleteUser } from '@/features/admin/admin-service'
import { createSupabaseServiceClient } from '@/lib/db/server'
import { uuidSchema } from '@/lib/validation/schemas'

export const dynamic = 'force-dynamic'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await resolveAdminContext()
  if (!ctx.ok) return adminAuthFail(ctx.code)

  const { id } = await params
  if (!uuidSchema.safeParse(id).success) {
    return fail(ErrorCodes.VALIDATION, 'Usuário inválido')
  }

  if (id === ctx.userId) {
    return fail(ErrorCodes.CONFLICT, 'Você não pode deletar a própria conta.')
  }

  const service = createSupabaseServiceClient()
  const result = await deleteUser(service, id)
  if (!result.ok) {
    if (result.code === 'not_found') {
      return fail(ErrorCodes.NOT_FOUND, 'Usuário não encontrado')
    }
    if (
      result.code === 'active_subscription' ||
      result.code === 'has_questions'
    ) {
      return fail(ErrorCodes.CONFLICT, result.message)
    }
    return fail(ErrorCodes.INTERNAL, 'Não foi possível deletar o usuário.')
  }

  return ok({ success: true })
}
