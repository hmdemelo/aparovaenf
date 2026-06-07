import type { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/roles'
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from '@/lib/db/server'
import { ErrorCodes, fail, ok } from '@/lib/api/response'
import { forcePasswordChangeInputSchema } from '@/lib/validation/schemas'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return fail(ErrorCodes.UNAUTHENTICATED, 'Authentication required')
  }
  if (!user.forcePasswordChange) {
    return fail(
      ErrorCodes.FORBIDDEN,
      'Não há troca obrigatória de senha pendente.',
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail(ErrorCodes.VALIDATION, 'Corpo da requisição inválido.')
  }

  const parsed = forcePasswordChangeInputSchema.safeParse(body)
  if (!parsed.success) {
    return fail(
      ErrorCodes.VALIDATION,
      parsed.error.issues[0]?.message ?? 'Senha inválida.',
    )
  }

  const db = await createSupabaseServerClient()
  const { error: authError } = await db.auth.updateUser({
    password: parsed.data.password,
  })
  if (authError) {
    return fail(ErrorCodes.VALIDATION, 'Não foi possível atualizar a senha.')
  }

  const service = createSupabaseServiceClient()
  const { error: profileError } = await service
    .from('user_profiles')
    .update({ force_password_change: false })
    .eq('id', user.id)

  if (profileError) {
    console.error(
      '[auth.force-password] failed to clear forced change flag',
      profileError,
    )
    return fail(
      ErrorCodes.INTERNAL,
      'A senha foi atualizada, mas a liberação não foi concluída. Tente novamente.',
    )
  }

  return ok({ changed: true })
}
