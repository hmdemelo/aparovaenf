import type { NextRequest } from 'next/server'
import { ok, fail, ErrorCodes } from '@/lib/api/response'
import { answerInputSchema } from '@/lib/validation/schemas'
import { createSupabaseServiceClient } from '@/lib/db/server'
import {
  gradeAnswer,
  recordAnswerAttempt,
} from '@/features/questions/question-repository'
import {
  resolveTrialStatus,
  serializeTrialStatus,
} from '@/features/trial/trial-server'
import { ensureAnonymousSessionId } from '@/features/trial/anonymous-session'
import { track } from '@/features/analytics/product-events-server'
import { ProductEventNames } from '@/features/analytics/product-events'

export const dynamic = 'force-dynamic'

// POST /api/answers — submit an answer, consume one trial unit, return feedback.
export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail(ErrorCodes.VALIDATION, 'Invalid JSON body')
  }

  const parsed = answerInputSchema.safeParse(body)
  if (!parsed.success) {
    return fail(ErrorCodes.VALIDATION, 'question_id and alternative_id are required')
  }

  const { status, userId, passwordChangeRequired } =
    await resolveTrialStatus()

  if (passwordChangeRequired) {
    return fail(ErrorCodes.FORBIDDEN, 'Password change required')
  }

  // Enforce gates before consuming trial.
  if (!status.canAnswer) {
    if (status.signupRequired) {
      return fail(ErrorCodes.SIGNUP_REQUIRED, 'Sign up to continue answering')
    }
    return fail(ErrorCodes.SUBSCRIPTION_REQUIRED, 'Subscribe to continue answering')
  }

  const svc = createSupabaseServiceClient()

  const grading = await gradeAnswer(svc, {
    questionId: parsed.data.question_id,
    selectedAlternativeId: parsed.data.alternative_id,
  })
  if (!grading) {
    return fail(ErrorCodes.NOT_FOUND, 'Question or alternative not found')
  }

  // Anonymous answers are tied to a cookie-backed session id.
  const anonymousSessionId = userId ? null : await ensureAnonymousSessionId()

  const { data: ctx } = await svc
    .from('questions')
    .select('career_id, board_id')
    .eq('id', parsed.data.question_id)
    .single()

  const recorded = await recordAnswerAttempt(svc, {
    userId,
    anonymousSessionId,
    questionId: parsed.data.question_id,
    selectedAlternativeId: parsed.data.alternative_id,
    isCorrect: grading.isCorrect,
    careerId: ctx?.career_id ?? null,
    boardId: ctx?.board_id ?? null,
  })
  if (!recorded.ok) {
    return fail(ErrorCodes.INTERNAL, 'Could not record the answer')
  }

  await track({
    event_name: ProductEventNames.QUESTION_ANSWERED,
    user_id: userId,
    anonymous_session_id: anonymousSessionId,
    career_id: ctx?.career_id ?? null,
    question_id: parsed.data.question_id,
    metadata: { is_correct: grading.isCorrect },
  })

  // Re-evaluate trial after this answer to drive the next UI step.
  const after = await resolveTrialStatus()
  if (after.status.signupRequired) {
    await track({
      event_name: ProductEventNames.SIGNUP_REQUIRED_SHOWN,
      anonymous_session_id: anonymousSessionId,
    })
  }
  if (after.status.paywallRequired) {
    await track({
      event_name: ProductEventNames.TRIAL_FINISHED,
      user_id: userId,
    })
  }

  return ok({
    is_correct: grading.isCorrect,
    correct_alternative_id: grading.correctAlternativeId,
    general_comment: grading.generalComment,
    selected_alternative_comment: grading.selectedAlternativeComment,
    trial_status: serializeTrialStatus(after.status),
  })
}
