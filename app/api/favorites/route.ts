import type { NextRequest } from 'next/server'
import { ok, fail, ErrorCodes } from '@/lib/api/response'
import { favoriteInputSchema } from '@/lib/validation/schemas'
import { createSupabaseServerClient } from '@/lib/db/server'
import { getCurrentUser, isSubscriber } from '@/lib/auth/roles'
import {
  addFavorite,
  evaluateFavoriteAccess,
  listFavorites,
} from '@/features/student-feed/favorites-service'
import { track } from '@/features/analytics/product-events-server'
import { ProductEventNames } from '@/features/analytics/product-events'

export const dynamic = 'force-dynamic'

// GET /api/favorites — list the subscriber's saved favorites.
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return fail(ErrorCodes.UNAUTHENTICATED, 'Authentication required')
  const db = await createSupabaseServerClient()
  const favorites = await listFavorites(db, user.id)
  return ok({ favorites })
}

// POST /api/favorites — save a favorite (active subscribers only).
export async function POST(request: NextRequest) {
  const user = await getCurrentUser()

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail(ErrorCodes.VALIDATION, 'Invalid JSON body')
  }
  const parsed = favoriteInputSchema.safeParse(body)
  if (!parsed.success) {
    return fail(ErrorCodes.VALIDATION, 'question_id is required')
  }

  const access = evaluateFavoriteAccess({
    isAuthenticated: user !== null,
    isSubscriber: user !== null && (await isSubscriber()),
  })

  if (!access.allowed) {
    // Record the attempt so the funnel can measure favorite intent.
    await track({
      event_name: ProductEventNames.FAVORITE_ATTEMPTED,
      user_id: user?.id ?? null,
      question_id: parsed.data.question_id,
    })
    return access.reason === 'unauthenticated'
      ? fail(ErrorCodes.UNAUTHENTICATED, 'Sign in to save favorites')
      : fail(ErrorCodes.SUBSCRIPTION_REQUIRED, 'Subscribe to save favorites')
  }

  const db = await createSupabaseServerClient()
  const result = await addFavorite(db, user!.id, parsed.data.question_id)
  if (!result.ok) return fail(ErrorCodes.INTERNAL, 'Could not save favorite')

  await track({
    event_name: ProductEventNames.FAVORITE_SAVED,
    user_id: user!.id,
    question_id: parsed.data.question_id,
  })
  return ok({ saved: true }, { status: 201 })
}
