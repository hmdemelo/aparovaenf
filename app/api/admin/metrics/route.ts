import { ok } from '@/lib/api/response'
import { adminAuthFail } from '@/lib/api/admin-guard'
import { resolveAdminContext } from '@/features/admin/admin-permissions'
import { getAdminMetrics } from '@/features/admin/admin-metrics-service'

export const dynamic = 'force-dynamic'

// GET /api/admin/metrics — launch funnel and content metrics.
export async function GET() {
  const ctx = await resolveAdminContext()
  if (!ctx.ok) return adminAuthFail(ctx.code)
  const metrics = await getAdminMetrics(ctx.db)
  return ok({ metrics })
}
