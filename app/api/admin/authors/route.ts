import type { NextRequest } from 'next/server'
import { ok, fail, ErrorCodes } from '@/lib/api/response'
import { adminAuthFail } from '@/lib/api/admin-guard'
import { resolveAdminContext } from '@/features/admin/admin-permissions'
import { createAuthor } from '@/features/admin/admin-service'
import { createSupabaseServiceClient } from '@/lib/db/server'
import { createAuthorInputSchema } from '@/lib/validation/schemas'

export const dynamic = 'force-dynamic'

// POST /api/admin/authors — provision a new author (auth user + profiles).
export async function POST(request: NextRequest) {
  const ctx = await resolveAdminContext()
  if (!ctx.ok) return adminAuthFail(ctx.code)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail(ErrorCodes.VALIDATION, 'Corpo da requisição inválido')
  }

  const parsed = createAuthorInputSchema.safeParse(body)
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join('; ')
    return fail(ErrorCodes.VALIDATION, message)
  }

  // Author provisioning needs the service role (Auth Admin API + RLS bypass).
  const service = createSupabaseServiceClient()
  const result = await createAuthor(service, parsed.data)
  if (!result.ok) {
    return result.code === 'conflict'
      ? fail(ErrorCodes.CONFLICT, 'Já existe um usuário com este e-mail')
      : fail(ErrorCodes.INTERNAL, result.message)
  }

  return ok(
    { author_id: result.authorId, user_id: result.userId },
    { status: 201 },
  )
}
