import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/db/middleware'

// Next.js 16 "proxy" convention (formerly "middleware"). Refreshes the Supabase
// auth session on every matched request.
export default async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  // Run on all routes except static assets.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
