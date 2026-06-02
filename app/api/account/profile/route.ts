import type { NextRequest } from 'next/server'
import { updateAccountProfile } from '@/features/account/account-service'
import { fail, ok, ErrorCodes } from '@/lib/api/response'
import { requireUser, AuthorizationError } from '@/lib/auth/roles'
import { createSupabaseServerClient } from '@/lib/db/server'
import { accountProfileInputSchema } from '@/lib/validation/schemas'

export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest) {
  let user
  try {
    user = await requireUser(['author', 'admin'])
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return error.kind === 'unauthenticated'
        ? fail(ErrorCodes.UNAUTHENTICATED, 'Entre para atualizar sua conta')
        : fail(ErrorCodes.FORBIDDEN, 'Acesso restrito a autores')
    }
    return fail(ErrorCodes.INTERNAL, 'Não foi possível validar a sessão')
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail(ErrorCodes.VALIDATION, 'Corpo da requisição inválido')
  }

  const parsed = accountProfileInputSchema.safeParse(body)
  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => issue.message).join('; ')
    return fail(ErrorCodes.VALIDATION, message)
  }

  const db = await createSupabaseServerClient()
  const result = await updateAccountProfile(db, user.id, parsed.data)
  if (!result.ok) {
    return fail(ErrorCodes.INTERNAL, 'Não foi possível atualizar sua conta')
  }

  return ok({ profile: result.profile })
}
