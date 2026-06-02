import { fail, ErrorCodes } from '@/lib/api/response'

/** Map an admin-context failure code to the standard error envelope. */
export function adminAuthFail(code: 'unauthenticated' | 'forbidden') {
  return code === 'unauthenticated'
    ? fail(ErrorCodes.UNAUTHENTICATED, 'Authentication required')
    : fail(ErrorCodes.FORBIDDEN, 'Admin access required')
}
