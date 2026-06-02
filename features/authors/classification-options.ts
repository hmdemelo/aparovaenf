import 'server-only'
import { createSupabaseServiceClient } from '@/lib/db/server'

/**
 * Load classification reference data (careers, subjects, boards) for the
 * question editor selects. Reference tables are public catalog data.
 */
export async function loadClassificationOptions() {
  const db = createSupabaseServiceClient()
  const [careers, subjects, boards] = await Promise.all([
    db.from('careers').select('id, name').order('name'),
    db.from('subjects').select('id, name, career_id').order('name'),
    db.from('boards').select('id, name').order('name'),
  ])
  return {
    careers: careers.data ?? [],
    subjects: subjects.data ?? [],
    boards: boards.data ?? [],
  }
}
