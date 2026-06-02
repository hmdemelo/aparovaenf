import { ok } from '@/lib/api/response'
import { adminAuthFail } from '@/lib/api/admin-guard'
import { resolveAdminContext } from '@/features/admin/admin-permissions'
import { listAllQuestions } from '@/features/admin/admin-service'

export const dynamic = 'force-dynamic'

// GET /api/admin/questions — all questions with author and status.
export async function GET() {
  const ctx = await resolveAdminContext()
  if (!ctx.ok) return adminAuthFail(ctx.code)
  const questions = await listAllQuestions(ctx.db)
  return ok({ questions })
}
