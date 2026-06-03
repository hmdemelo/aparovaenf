import 'server-only'
import { createSupabaseServerClient } from './server'

/**
 * Slug of the current launch career (the one shown on the landing page).
 * Used to send paying students into a valid feed when no specific career was
 * requested. Returns null when no launch career is configured.
 */
export async function getLaunchCareerSlug(): Promise<string | null> {
  const db = await createSupabaseServerClient()
  const { data } = await db
    .from('careers')
    .select('slug')
    .eq('is_launch_career', true)
    .order('name')
    .limit(1)
  return data?.[0]?.slug ?? null
}
