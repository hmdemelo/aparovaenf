/**
 * Asks the server where to navigate after a successful sign-in. The decision
 * (role + subscription) is made server-side; on any failure we fall back to the
 * requested `next` so the user is never stranded on the auth screen.
 */
export async function fetchPostLoginDestination(next: string): Promise<string> {
  try {
    const res = await fetch(
      `/api/auth/post-login?next=${encodeURIComponent(next)}`,
      { cache: 'no-store' },
    )
    const json = await res.json()
    if (json?.success && typeof json.data?.destination === 'string') {
      return json.data.destination
    }
  } catch {
    // network/parse failure — fall through to `next`
  }
  return next
}
