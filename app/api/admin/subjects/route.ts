import type { NextRequest } from 'next/server'
import { ok, fail, ErrorCodes } from '@/lib/api/response'
import { adminAuthFail } from '@/lib/api/admin-guard'
import { resolveAdminContext } from '@/features/admin/admin-permissions'
import { createSubject } from '@/features/admin/subject-service'
import { createSupabaseServiceClient } from '@/lib/db/server'
import { createSubjectInputSchema } from '@/lib/validation/schemas'

export const dynamic = 'force-dynamic'

// POST /api/admin/subjects — register a subject under a career.
export async function POST(request: NextRequest) {
  const ctx = await resolveAdminContext()
  if (!ctx.ok) return adminAuthFail(ctx.code)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail(ErrorCodes.VALIDATION, 'Corpo da requisição inválido')
  }

  const parsed = createSubjectInputSchema.safeParse(body)
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join('; ')
    return fail(ErrorCodes.VALIDATION, message)
  }

  // `subjects` has no INSERT RLS policy, so creation needs the service role.
  const service = createSupabaseServiceClient()
  const result = await createSubject(service, parsed.data)
  if (!result.ok) {
    return result.code === 'conflict'
      ? fail(ErrorCodes.CONFLICT, 'Já existe um assunto com este slug nesta carreira')
      : fail(ErrorCodes.INTERNAL, result.message)
  }

  return ok({ subject_id: result.id }, { status: 201 })
}
