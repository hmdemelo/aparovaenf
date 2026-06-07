import type { NextRequest } from 'next/server'
import { ErrorCodes, fail, ok } from '@/lib/api/response'
import { adminAuthFail } from '@/lib/api/admin-guard'
import { resolveAdminContext } from '@/features/admin/admin-permissions'
import { listQuestionsPage } from '@/features/admin/admin-service'
import { adminQuestionsQuerySchema } from '@/lib/validation/schemas'

export const dynamic = 'force-dynamic'

// GET /api/admin/questions — all questions with author and status.
export async function GET(request: NextRequest) {
  const ctx = await resolveAdminContext()
  if (!ctx.ok) return adminAuthFail(ctx.code)

  const parsed = adminQuestionsQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  )
  if (!parsed.success) {
    return fail(
      ErrorCodes.VALIDATION,
      parsed.error.issues[0]?.message ?? 'Parâmetros inválidos.',
    )
  }

  try {
    const result = await listQuestionsPage(ctx.db, {
      search: parsed.data.q,
      status: parsed.data.status,
      subjectId: parsed.data.subject_id,
      boardId: parsed.data.board_id,
      page: parsed.data.page,
      limit: parsed.data.limit,
    })
    return ok(result)
  } catch (error) {
    console.error('[admin.questions] failed to list questions', error)
    return fail(ErrorCodes.INTERNAL, 'Não foi possível carregar as questões.')
  }
}
