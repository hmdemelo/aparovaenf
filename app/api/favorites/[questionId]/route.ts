import type { NextRequest } from 'next/server'
import { ok, fail, ErrorCodes } from '@/lib/api/response'
import { uuidSchema } from '@/lib/validation/schemas'
import { createSupabaseServerClient } from '@/lib/db/server'
import { getCurrentUser } from '@/lib/auth/roles'
import { removeFavorite } from '@/features/student-feed/favorites-service'

export const dynamic = 'force-dynamic'

// DELETE /api/favorites/:questionId — remove a saved favorite.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ questionId: string }> },
) {
  const user = await getCurrentUser()
  if (!user) return fail(ErrorCodes.UNAUTHENTICATED, 'Authentication required')

  const { questionId } = await params
  if (!uuidSchema.safeParse(questionId).success) {
    return fail(ErrorCodes.VALIDATION, 'Invalid question id')
  }

  const db = await createSupabaseServerClient()
  const result = await removeFavorite(db, user.id, questionId)
  if (!result.ok) return fail(ErrorCodes.INTERNAL, 'Could not remove favorite')
  return ok({ removed: true })
}
