import type { NextRequest } from 'next/server'
import { ok, fail, ErrorCodes } from '@/lib/api/response'
import { adminAuthFail } from '@/lib/api/admin-guard'
import { resolveAdminContext } from '@/features/admin/admin-permissions'
import { adminChangeUserPassword } from '@/features/admin/admin-service'
import { createSupabaseServiceClient } from '@/lib/db/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const schema = z.object({
  userId: z.string().uuid(),
  password: z
    .string()
    .min(8, 'A senha deve ter no mínimo 8 caracteres')
    .max(72, 'A senha deve ter no máximo 72 caracteres'),
})

export async function POST(request: NextRequest) {
  const ctx = await resolveAdminContext()
  if (!ctx.ok) return adminAuthFail(ctx.code)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail(ErrorCodes.VALIDATION, 'Corpo da requisição inválido')
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join('; ')
    return fail(ErrorCodes.VALIDATION, message)
  }

  const service = createSupabaseServiceClient()
  const result = await adminChangeUserPassword(service, parsed.data.userId, {
    password: parsed.data.password,
  })

  if (!result.ok) {
    return result.code === 'not_found'
      ? fail(ErrorCodes.NOT_FOUND, 'Usuário não encontrado.')
      : fail(ErrorCodes.INTERNAL, 'Não foi possível alterar a senha.')
  }

  return ok({ success: true })
}
