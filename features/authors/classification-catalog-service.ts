import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/db/database.types'
import { slugify } from '@/lib/text/slugify'
import { createSupabaseServiceClient, createSupabaseServerClient } from '@/lib/db/server'
import { getCurrentUser } from '@/lib/auth/roles'
import { getAuthorProfileId } from '@/features/authors/author-permissions'

type Db = SupabaseClient<Database>
const CATALOG_CREATE_ERROR = 'Não foi possível cadastrar este item. Tente novamente.'

export type CatalogContext =
  | { ok: true; db: Db; userId: string; role: 'author' | 'admin'; authorId: string | null }
  | { ok: false; code: 'unauthenticated' | 'forbidden' }

export type CatalogServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: 'error' | 'not_found' | 'conflict'; errors: string[] }

/**
 * Resolve the catalog context allowing both authors and admins,
 * even if an admin doesn't have an author profile.
 */
export async function resolveCatalogContext(): Promise<CatalogContext> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, code: 'unauthenticated' }
  if (user.forcePasswordChange) return { ok: false, code: 'forbidden' }
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
  metadata: Json,
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
    return { ok: false, code: 'error', errors: [CATALOG_CREATE_ERROR] }
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
        .eq('subject_id', input.discipline_id)
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
    return { ok: false, code: 'error', errors: [CATALOG_CREATE_ERROR] }
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
    return { ok: false, code: 'error', errors: [CATALOG_CREATE_ERROR] }
  }

  await logCatalogEvent(context.userId, 'author_catalog_item_created', {
    type: 'board',
    id: data.id,
    name: data.name
  })

  return { ok: true, data: { created: true, item: data } }
}

export async function updateDiscipline(
  db: Db,
  id: string,
  input: { name: string; career_id: string },
): Promise<CatalogServiceResult<{ id: string; name: string }>> {
  const name = input.name.trim()
  const slug = slugify(name)
  const { data, error } = await db
    .from('subjects')
    .update({ name, slug, career_id: input.career_id })
    .eq('id', id)
    .select('id, name')
    .maybeSingle()

  if (error) {
    return catalogWriteError(error)
  }
  if (!data) return catalogNotFound()
  return { ok: true, data }
}

export async function deleteDiscipline(
  db: Db,
  id: string
): Promise<CatalogServiceResult<void>> {
  const { count: questionsCount, error: questionsError } = await db
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .eq('subject_id', id)

  if (questionsError) return catalogDependencyError()
  if (questionsCount && questionsCount > 0) {
    return { ok: false, code: 'error', errors: ['Esta disciplina está em uso por questões e não pode ser excluída.'] }
  }

  const { count: tagsCount, error: tagsError } = await db
    .from('tags')
    .select('id', { count: 'exact', head: true })
    .eq('subject_id', id)

  if (tagsError) return catalogDependencyError()
  if (tagsCount && tagsCount > 0) {
    return { ok: false, code: 'error', errors: ['Esta disciplina possui assuntos associados e não pode ser excluída.'] }
  }

  const { error } = await db.from('subjects').delete().eq('id', id)
  if (error) {
    return catalogWriteError(error)
  }
  return { ok: true, data: undefined }
}

export async function updateTopic(
  db: Db,
  id: string,
  input: { name: string; discipline_id: string },
): Promise<CatalogServiceResult<{ id: string; name: string }>> {
  const name = input.name.trim()
  const slug = slugify(name)
  const { data, error } = await db
    .from('tags')
    .update({ name, slug, subject_id: input.discipline_id })
    .eq('id', id)
    .select('id, name')
    .maybeSingle()

  if (error) {
    return catalogWriteError(error)
  }
  if (!data) return catalogNotFound()
  return { ok: true, data }
}

export async function deleteTopic(
  db: Db,
  id: string
): Promise<CatalogServiceResult<void>> {
  const { count: qtCount, error: associationsError } = await db
    .from('question_tags')
    .select('question_id', { count: 'exact', head: true })
    .eq('tag_id', id)

  if (associationsError) return catalogDependencyError()
  if (qtCount && qtCount > 0) {
    return { ok: false, code: 'error', errors: ['Este assunto está em uso por questões e não pode ser excluído.'] }
  }

  const { error } = await db.from('tags').delete().eq('id', id)
  if (error) {
    return catalogWriteError(error)
  }
  return { ok: true, data: undefined }
}

export async function updateBoard(
  db: Db,
  id: string,
  input: { name: string }
): Promise<CatalogServiceResult<{ id: string; name: string }>> {
  const name = input.name.trim()
  const slug = slugify(name)
  const { data, error } = await db
    .from('boards')
    .update({ name, slug })
    .eq('id', id)
    .select('id, name')
    .maybeSingle()

  if (error) {
    return catalogWriteError(error)
  }
  if (!data) return catalogNotFound()
  return { ok: true, data }
}

export async function deleteBoard(
  db: Db,
  id: string
): Promise<CatalogServiceResult<void>> {
  const { count: qCount, error: questionsError } = await db
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .eq('board_id', id)

  if (questionsError) return catalogDependencyError()
  if (qCount && qCount > 0) {
    return { ok: false, code: 'error', errors: ['Esta banca está em uso por questões e não pode ser excluída.'] }
  }

  const { error } = await db.from('boards').delete().eq('id', id)
  if (error) {
    return catalogWriteError(error)
  }
  return { ok: true, data: undefined }
}

function catalogNotFound<T>(): CatalogServiceResult<T> {
  return {
    ok: false,
    code: 'not_found',
    errors: ['Item de catálogo não encontrado.'],
  }
}

function catalogDependencyError<T>(): CatalogServiceResult<T> {
  return {
    ok: false,
    code: 'error',
    errors: ['Não foi possível verificar as dependências deste item.'],
  }
}

function catalogWriteError<T>(error: {
  code?: string
}): CatalogServiceResult<T> {
  if (error.code === '23505') {
    return {
      ok: false,
      code: 'conflict',
      errors: ['Já existe um item com este nome no mesmo contexto.'],
    }
  }
  if (error.code === '23503') {
    return {
      ok: false,
      code: 'conflict',
      errors: ['Este item possui vínculos e não pode ser excluído.'],
    }
  }
  return {
    ok: false,
    code: 'error',
    errors: ['Não foi possível concluir a alteração no catálogo.'],
  }
}
