import type { NextRequest } from 'next/server'
import { ok, fail, ErrorCodes } from '@/lib/api/response'
import { feedQuerySchema } from '@/lib/validation/schemas'
import { createSupabaseServiceClient } from '@/lib/db/server'
import {
  getNextQuestion,
  getAnsweredQuestionIdsBySession,
  getAnsweredQuestionIdsByUser,
} from '@/features/questions/question-repository'
import { resolveTrialStatus, serializeTrialStatus } from '@/features/trial/trial-server'
import { track } from '@/features/analytics/product-events-server'
import { ProductEventNames } from '@/features/analytics/product-events'

export const dynamic = 'force-dynamic'

// GET /api/feed/next?career=<slug>&board=<slug>
// Returns the next eligible question without consuming trial. When the visitor
// has hit a gate, returns question:null plus the trial status so the UI can
// render the signup gate or paywall.
export async function GET(request: NextRequest) {
  const parsed = feedQuerySchema.safeParse({
    career: request.nextUrl.searchParams.get('career') ?? undefined,
    board: request.nextUrl.searchParams.get('board') ?? undefined,
    subject: request.nextUrl.searchParams.get('subject') ?? undefined,
    tags: request.nextUrl.searchParams.get('tags') ?? undefined,
  })
  if (!parsed.success) {
    return fail(ErrorCodes.VALIDATION, 'career is required')
  }

  const {
    status,
    userId,
    anonymousSessionId,
    passwordChangeRequired,
  } = await resolveTrialStatus()

  if (passwordChangeRequired) {
    return fail(ErrorCodes.FORBIDDEN, 'Password change required')
  }

  // Gated: do not reveal another question until the gate is cleared.
  if (!status.canAnswer) {
    return ok({ question: null, trial_status: serializeTrialStatus(status) })
  }

  const svc = createSupabaseServiceClient()
  const excludeIds = userId
    ? await getAnsweredQuestionIdsByUser(svc, userId)
    : anonymousSessionId
      ? await getAnsweredQuestionIdsBySession(svc, anonymousSessionId)
      : []

  const question = await getNextQuestion(svc, {
    careerSlug: parsed.data.career,
    boardSlug: parsed.data.board,
    subjectId: parsed.data.subject,
    tagIds: parsed.data.tags,
    excludeIds,
  })

  if (question) {
    await track({
      event_name: ProductEventNames.QUESTION_VIEWED,
      user_id: userId,
      anonymous_session_id: anonymousSessionId,
      career_id: question.career.id,
      question_id: question.id,
    })
  }

  return ok({ question, trial_status: serializeTrialStatus(status) })
}
