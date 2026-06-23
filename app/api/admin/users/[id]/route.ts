import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { adminAuthFail } from '@/lib/api/admin-guard'
import { ErrorCodes, fail, ok } from '@/lib/api/response'
import { resolveAdminContext } from '@/features/admin/admin-permissions'
import { deleteUser, setUserFreeAccess } from '@/features/admin/admin-service'
import { createSupabaseServiceClient } from '@/lib/db/server'
import { uuidSchema } from '@/lib/validation/schemas'

export const dynamic = 'force-dynamic'

const patchSchema = z.object({ freeAccess: z.boolean() })

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await resolveAdminContext()
  if (!ctx.ok) return adminAuthFail(ctx.code)

  const { id } = await params
  if (!uuidSchema.safeParse(id).success) {
    return fail(ErrorCodes.VALIDATION, 'Usuário inválido')
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail(ErrorCodes.VALIDATION, 'Corpo da requisição inválido')
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return fail(ErrorCodes.VALIDATION, 'Valor de acesso inválido')
  }

  const service = createSupabaseServiceClient()
  const result = await setUserFreeAccess(service, id, parsed.data.freeAccess)
  if (!result.ok) {
    if (result.code === 'not_found') {
      return fail(ErrorCodes.NOT_FOUND, 'Usuário não encontrado')
    }
    return fail(ErrorCodes.INTERNAL, 'Não foi possível atualizar o acesso.')
  }

  return ok({ freeAccess: result.freeAccess })
}

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
