import { ok } from '@/lib/api/response'
import { resolveTrialStatus, serializeTrialStatus } from '@/features/trial/trial-server'

export const dynamic = 'force-dynamic'

// GET /api/trial/status — current access state for the session/user.
export async function GET() {
  const { status } = await resolveTrialStatus()
  return ok(serializeTrialStatus(status))
}
