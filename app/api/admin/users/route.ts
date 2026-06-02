import { ok } from '@/lib/api/response'
import { adminAuthFail } from '@/lib/api/admin-guard'
import { resolveAdminContext } from '@/features/admin/admin-permissions'
import { listUsers } from '@/features/admin/admin-service'

export const dynamic = 'force-dynamic'

// GET /api/admin/users — users with role and subscription status.
export async function GET() {
  const ctx = await resolveAdminContext()
  if (!ctx.ok) return adminAuthFail(ctx.code)
  const users = await listUsers(ctx.db)
  return ok({ users })
}
