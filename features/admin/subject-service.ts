import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/db/database.types'
import type { CreateSubjectInput } from '@/lib/validation/schemas'
import { slugify } from '@/lib/text/slugify'

type Db = SupabaseClient<Database>

/**
 * Admin subject management: list careers/subjects for the registration screen
 * and create new subjects. Reference tables are public-readable, but `subjects`
 * has no INSERT policy, so creation must run with a service-role client.
 */

export type CareerOption = {
  id: string
  name: string
}

export async function listCareers(db: Db): Promise<CareerOption[]> {
  const { data } = await db.from('careers').select('id, name').order('name')
  return data ?? []
}

export type AdminSubjectRow = {
  id: string
  name: string
  slug: string
  career: string | null
}

export async function listSubjects(db: Db): Promise<AdminSubjectRow[]> {
  const { data } = await db
    .from('subjects')
    .select('id, name, slug, career:careers(name)')
    .order('name')

  return (data ?? []).map((s) => {
    const career = Array.isArray(s.career) ? s.career[0] : s.career
    return {
      id: s.id,
      name: s.name,
      slug: s.slug,
      career: career?.name ?? null,
    }
  })
}

export type CreateSubjectResult =
  | { ok: true; id: string }
  | { ok: false; code: 'conflict' | 'error'; message: string }

/**
 * Create a subject under a career. Requires the SERVICE-ROLE client because the
 * `subjects` table has no INSERT RLS policy. The slug is derived from the name
 * when not provided. A duplicate (career_id, slug) is reported as a conflict.
 */
export async function createSubject(
  serviceDb: Db,
  input: CreateSubjectInput,
): Promise<CreateSubjectResult> {
  const slug = slugify(input.slug ?? input.name)
  if (!slug) {
    return { ok: false, code: 'error', message: 'slug inválido' }
  }

  const { data, error } = await serviceDb
    .from('subjects')
    .insert({ career_id: input.career_id, name: input.name, slug })
    .select('id')
    .single()

  if (error || !data) {
    const message = error?.message ?? 'could not create subject'
    const isConflict =
      error?.code === '23505' || /duplicate|unique|already exists/i.test(message)
    return { ok: false, code: isConflict ? 'conflict' : 'error', message }
  }

  return { ok: true, id: data.id }
}
