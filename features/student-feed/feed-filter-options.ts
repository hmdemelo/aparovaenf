import 'server-only'
import { createSupabaseServiceClient } from '@/lib/db/server'

export type FeedFilterOption = { id: string; name: string }
export type FeedBoardOption = { id: string; name: string; slug: string }

export type FeedFilterOptions = {
  subjects: FeedFilterOption[]
  boards: FeedBoardOption[]
  tags: FeedFilterOption[]
}

/**
 * Load the filter catalog for the student feed: subjects scoped to the given
 * career, all boards (with slug, since the feed filters boards by slug), and the
 * dynamic tag list. All are public catalog data.
 */
export async function loadFeedFilterOptions(
  careerSlug: string,
): Promise<FeedFilterOptions> {
  const db = createSupabaseServiceClient()

  const { data: career } = await db
    .from('careers')
    .select('id')
    .eq('slug', careerSlug)
    .maybeSingle()

  const subjectsQuery = career
    ? db.from('subjects').select('id, name').eq('career_id', career.id).order('name')
    : null

  const [subjects, boards, tags] = await Promise.all([
    subjectsQuery,
    db.from('boards').select('id, name, slug').order('name'),
    db.from('tags').select('id, name').order('name'),
  ])

  return {
    subjects: subjects?.data ?? [],
    boards: boards.data ?? [],
    tags: tags.data ?? [],
  }
}
