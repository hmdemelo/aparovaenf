import { NextResponse } from 'next/server'

/**
 * Shared API response envelope.
 *
 * Every route handler returns one of these shapes so clients can branch on
 * `success` consistently. See specs/001-aprovaenf-mvp/contracts/api.md.
 */

export type SuccessEnvelope<T> = {
  success: true
  data: T
  meta?: Record<string, unknown>
}

export type ErrorEnvelope = {
  success: false
  error: {
    code: string
    message: string
  }
}

export type ApiEnvelope<T> = SuccessEnvelope<T> | ErrorEnvelope

/** Stable, machine-readable error codes used across handlers. */
export const ErrorCodes = {
  UNAUTHENTICATED: 'unauthenticated',
  FORBIDDEN: 'forbidden',
  NOT_FOUND: 'not_found',
  VALIDATION: 'validation_error',
  TRIAL_EXHAUSTED: 'trial_exhausted',
  SIGNUP_REQUIRED: 'signup_required',
  SUBSCRIPTION_REQUIRED: 'subscription_required',
  CONFLICT: 'conflict',
  RATE_LIMITED: 'rate_limited',
  INTERNAL: 'internal_error',
} as const

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes]

const DEFAULT_ERROR_STATUS: Record<ErrorCode, number> = {
  [ErrorCodes.UNAUTHENTICATED]: 401,
  [ErrorCodes.FORBIDDEN]: 403,
  [ErrorCodes.NOT_FOUND]: 404,
  [ErrorCodes.VALIDATION]: 422,
  [ErrorCodes.TRIAL_EXHAUSTED]: 402,
  [ErrorCodes.SIGNUP_REQUIRED]: 401,
  [ErrorCodes.SUBSCRIPTION_REQUIRED]: 402,
  [ErrorCodes.CONFLICT]: 409,
  [ErrorCodes.RATE_LIMITED]: 429,
  [ErrorCodes.INTERNAL]: 500,
}

/** Build a success response with optional metadata and HTTP status. */
export function ok<T>(
  data: T,
  options?: { meta?: Record<string, unknown>; status?: number },
): NextResponse<SuccessEnvelope<T>> {
  const body: SuccessEnvelope<T> = { success: true, data }
  if (options?.meta) body.meta = options.meta
  return NextResponse.json(body, { status: options?.status ?? 200 })
}

/**
 * Build an error response. HTTP status defaults to a sensible value per code
 * but can be overridden.
 */
export function fail(
  code: ErrorCode,
  message: string,
  options?: { status?: number },
): NextResponse<ErrorEnvelope> {
  const status = options?.status ?? DEFAULT_ERROR_STATUS[code] ?? 400
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status },
  )
}
