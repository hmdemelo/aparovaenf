import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/db/database.types'
import { slugify } from '@/lib/text/slugify'
import { createSupabaseServiceClient, createSupabaseServerClient } from '@/lib/db/server'
import { getCurrentUser } from '@/lib/auth/roles'
import { getAuthorProfileId } from '@/features/authors/author-permissions'

type Db = SupabaseClient<Database>

export type CatalogContext =
  | { ok: true; db: Db; userId: string; role: 'author' | 'admin'; authorId: string | null }
  | { ok: false; code: 'unauthenticated' | 'forbidden' }

export type CatalogServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: 'error'; errors: string[] }

/**
 * Resolve the catalog context allowing both authors and admins,
 * even if an admin doesn't have an author profile.
 */
export async function resolveCatalogContext(): Promise<CatalogContext> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, code: 'unauthenticated' }
  if (user.role !== 'author' && user.role !== 'admin') {
    return { ok: false, code: 'forbidden' }
  }

  const db = await createSupabaseServerClient()
  const authorId = await getAuthorProfileId(db, user.id)
  if (user.role === 'author' && !authorId) {
    return { ok: false, code: 'forbidden' }
  }

  return { ok: true, db, userId: user.id, role: user.role, authorId }
}

function getCreatorInfo(
  kind: string,
  authorId: string | null,
  creator: { display_name: string; is_public: boolean } | null,
  currentAuthorId: string | null
) {
  const isCurrentUser = currentAuthorId ? authorId === currentAuthorId : false
  let label = 'Sistema'
  if (kind === 'admin') {
    label = 'Administração'
  } else if (kind === 'author') {
    if (isCurrentUser) {
      label = 'Você'
    } else if (creator && creator.is_public) {
      label = creator.display_name
    } else {
      label = 'Autor'
    }
  }
  return { label, is_current_user: isCurrentUser }
}

// Shared operational logger
export async function logCatalogEvent(
  userId: string,
  event: 'author_catalog_item_created' | 'author_catalog_item_create_failed',
  metadata: Record<string, unknown>
) {
  try {
    const db = createSupabaseServiceClient()
    await db.from('product_events').insert({
      user_id: userId,
      event_name: event,
      metadata
    })
  } catch (e) {
    console.error('Failed to log product event', e)
  }
}

// --- List Disciplines ---
export async function listDisciplines(
  db: Db,
  currentAuthorId: string | null,
  query: { q?: string | null; page: number; page_size: number; career_id?: string | null }
) {
  let dbQuery = db
    .from('subjects')
    .select(`
      id, name, slug, created_by_kind, created_by_author_id, created_at,
      career:careers(id, name),
      creator:author_profiles(display_name, is_public)
    `, { count: 'exact' })

  if (query.career_id) {
    dbQuery = dbQuery.eq('career_id', query.career_id)
  }

  if (query.q && query.q.trim()) {
    dbQuery = dbQuery.ilike('slug', `%${slugify(query.q)}%`)
  }

  const from = (query.page - 1) * query.page_size
  const to = from + query.page_size - 1

  const { data, count, error } = await dbQuery
    .order('name', { ascending: true })
    .order('id', { ascending: true })
    .range(from, to)

  if (error) throw error

  const items = (data ?? []).map((rowObj) => {
    const row = rowObj as {
      id: string
      name: string
      created_by_kind: string
      created_by_author_id: string | null
      created_at: string
      career: { id: string; name: string } | null
      creator: { display_name: string; is_public: boolean } | null
    }
    const creator = row.creator
    const career = row.career
    return {
      id: row.id,
      name: row.name,
      career: career ? { id: career.id, name: career.name } : null,
      created_by: getCreatorInfo(row.created_by_kind, row.created_by_author_id, creator, currentAuthorId),
      created_at: row.created_at,
    }
  })

  const total = count ?? 0
  const total_pages = Math.ceil(total / query.page_size)

  return {
    items,
    pagination: {
      page: query.page,
      page_size: query.page_size,
      total,
      total_pages,
    }
  }
}

// --- Create Discipline ---
export async function createDiscipline(
  db: Db,
  context: { role: 'author' | 'admin'; authorId: string | null; userId: string },
  input: { name: string; career_id: string }
): Promise<CatalogServiceResult<{ created: boolean; item: { id: string; name: string } }>> {
  const trimmed = input.name.trim()
  const slugified = slugify(trimmed)
  const isKindAuthor = context.role === 'author'
  const createdByKind = isKindAuthor ? 'author' : 'admin'
  const createdByAuthorId = isKindAuthor ? context.authorId : null

  const { data, error } = await db
    .from('subjects')
    .insert({
      name: trimmed,
      slug: slugified,
      career_id: input.career_id,
      created_by_kind: createdByKind,
      created_by_author_id: createdByAuthorId
    })
    .select('id, name')
    .single()

  if (error) {
    if (error.code === '23505') {
      const { data: existing } = await db
        .from('subjects')
        .select('id, name')
        .eq('career_id', input.career_id)
        .eq('slug', slugified)
        .single()

      if (existing) {
        return { ok: true, data: { created: false, item: existing } }
      }
    }
    await logCatalogEvent(context.userId, 'author_catalog_item_create_failed', {
      type: 'discipline',
      name: trimmed,
      career_id: input.career_id,
      error: error.message
    })
    return { ok: false, code: 'error', errors: [error.message] }
  }

  await logCatalogEvent(context.userId, 'author_catalog_item_created', {
    type: 'discipline',
    id: data.id,
    name: data.name,
    career_id: input.career_id
  })

  return { ok: true, data: { created: true, item: data } }
}

// --- List Topics ---
export async function listTopics(
  db: Db,
  currentAuthorId: string | null,
  query: { q?: string | null; page: number; page_size: number; discipline_id?: string | null }
) {
  let dbQuery = db
    .from('tags')
    .select(`
      id, name, slug, created_by_kind, created_by_author_id, created_at, subject_id,
      discipline:subjects(
        id, name,
        career:careers(id, name)
      ),
      creator:author_profiles(display_name, is_public)
    `, { count: 'exact' })

  if (query.discipline_id) {
    dbQuery = dbQuery.eq('subject_id', query.discipline_id)
  }

  if (query.q && query.q.trim()) {
    dbQuery = dbQuery.ilike('slug', `%${slugify(query.q)}%`)
  }

  const from = (query.page - 1) * query.page_size
  const to = from + query.page_size - 1

  const { data, count, error } = await dbQuery
    .order('name', { ascending: true })
    .order('id', { ascending: true })
    .range(from, to)

  if (error) throw error

  const items = (data ?? []).map((rowObj) => {
    const row = rowObj as {
      id: string
      name: string
      created_by_kind: string
      created_by_author_id: string | null
      created_at: string
      discipline: {
        id: string
        name: string
        career: { id: string; name: string } | null
      } | null
      creator: { display_name: string; is_public: boolean } | null
    }
    const creator = row.creator
    const discipline = row.discipline
    const career = discipline?.career

    return {
      id: row.id,
      name: row.name,
      discipline: discipline ? { id: discipline.id, name: discipline.name } : null,
      career: career ? { id: career.id, name: career.name } : null,
      created_by: getCreatorInfo(row.created_by_kind, row.created_by_author_id, creator, currentAuthorId),
      created_at: row.created_at,
    }
  })

  const total = count ?? 0
  const total_pages = Math.ceil(total / query.page_size)

  return {
    items,
    pagination: {
      page: query.page,
      page_size: query.page_size,
      total,
      total_pages,
    }
  }
}

// --- Create Topic ---
export async function createTopic(
  db: Db,
  context: { role: 'author' | 'admin'; authorId: string | null; userId: string },
  input: { name: string; discipline_id: string }
): Promise<CatalogServiceResult<{ created: boolean; item: { id: string; name: string } }>> {
  const trimmed = input.name.trim()
  const slugified = slugify(trimmed)
  const isKindAuthor = context.role === 'author'
  const createdByKind = isKindAuthor ? 'author' : 'admin'
  const createdByAuthorId = isKindAuthor ? context.authorId : null

  const { data, error } = await db
    .from('tags')
    .insert({
      name: trimmed,
      slug: slugified,
      subject_id: input.discipline_id,
      created_by_kind: createdByKind,
      created_by_author_id: createdByAuthorId
    })
    .select('id, name')
    .single()

  if (error) {
    if (error.code === '23505') {
      const { data: existing } = await db
        .from('tags')
        .select('id, name')
        .eq('slug', slugified)
        .maybeSingle()

      if (existing) {
        return { ok: true, data: { created: false, item: existing } }
      }
    }
    await logCatalogEvent(context.userId, 'author_catalog_item_create_failed', {
      type: 'topic',
      name: trimmed,
      discipline_id: input.discipline_id,
      error: error.message
    })
    return { ok: false, code: 'error', errors: [error.message] }
  }

  await logCatalogEvent(context.userId, 'author_catalog_item_created', {
    type: 'topic',
    id: data.id,
    name: data.name,
    discipline_id: input.discipline_id
  })

  return { ok: true, data: { created: true, item: data } }
}

// --- List Boards ---
export async function listBoards(
  db: Db,
  currentAuthorId: string | null,
  query: { q?: string | null; page: number; page_size: number }
) {
  let dbQuery = db
    .from('boards')
    .select(`
      id, name, slug, created_by_kind, created_by_author_id, created_at,
      creator:author_profiles(display_name, is_public)
    `, { count: 'exact' })

  if (query.q && query.q.trim()) {
    dbQuery = dbQuery.ilike('slug', `%${slugify(query.q)}%`)
  }

  const from = (query.page - 1) * query.page_size
  const to = from + query.page_size - 1

  const { data, count, error } = await dbQuery
    .order('name', { ascending: true })
    .order('id', { ascending: true })
    .range(from, to)

  if (error) throw error

  const items = (data ?? []).map((rowObj) => {
    const row = rowObj as {
      id: string
      name: string
      created_by_kind: string
      created_by_author_id: string | null
      created_at: string
      creator: { display_name: string; is_public: boolean } | null
    }
    const creator = row.creator
    return {
      id: row.id,
      name: row.name,
      created_by: getCreatorInfo(row.created_by_kind, row.created_by_author_id, creator, currentAuthorId),
      created_at: row.created_at,
    }
  })

  const total = count ?? 0
  const total_pages = Math.ceil(total / query.page_size)

  return {
    items,
    pagination: {
      page: query.page,
      page_size: query.page_size,
      total,
      total_pages,
    }
  }
}

// --- Create Board ---
export async function createBoard(
  db: Db,
  context: { role: 'author' | 'admin'; authorId: string | null; userId: string },
  input: { name: string }
): Promise<CatalogServiceResult<{ created: boolean; item: { id: string; name: string } }>> {
  const trimmed = input.name.trim()
  const slugified = slugify(trimmed)
  const isKindAuthor = context.role === 'author'
  const createdByKind = isKindAuthor ? 'author' : 'admin'
  const createdByAuthorId = isKindAuthor ? context.authorId : null

  const { data, error } = await db
    .from('boards')
    .insert({
      name: trimmed,
      slug: slugified,
      created_by_kind: createdByKind,
      created_by_author_id: createdByAuthorId
    })
    .select('id, name')
    .single()

  if (error) {
    if (error.code === '23505') {
      const { data: existing } = await db
        .from('boards')
        .select('id, name')
        .eq('slug', slugified)
        .single()

      if (existing) {
        return { ok: true, data: { created: false, item: existing } }
      }
    }
    await logCatalogEvent(context.userId, 'author_catalog_item_create_failed', {
      type: 'board',
      name: trimmed,
      error: error.message
    })
    return { ok: false, code: 'error', errors: [error.message] }
  }

  await logCatalogEvent(context.userId, 'author_catalog_item_created', {
    type: 'board',
    id: data.id,
    name: data.name
  })

  return { ok: true, data: { created: true, item: data } }
}
