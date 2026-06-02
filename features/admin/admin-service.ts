import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/db/database.types'
import type { CreateAuthorInput } from '@/lib/validation/schemas'

type Db = SupabaseClient<Database>

/**
 * Admin operations over users and questions. All reads/writes run under the
 * admin's RLS (is_admin() policies), so the caller must be an admin.
 */

export type AdminUserRow = {
  id: string
  name: string | null
  email: string | null
  role: string
  createdAt: string
  subscriptionStatus: string | null
  subscriptionPlan: string | null
}

export async function listUsers(db: Db): Promise<AdminUserRow[]> {
  const [{ data: users }, { data: subs }] = await Promise.all([
    db
      .from('user_profiles')
      .select('id, name, email, role, created_at')
      .order('created_at', { ascending: false }),
    db.from('subscriptions').select('user_id, status, plan').eq('status', 'active'),
  ])

  const activeByUser = new Map((subs ?? []).map((s) => [s.user_id, s]))

  return (users ?? []).map((u) => {
    const sub = activeByUser.get(u.id)
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.created_at,
      subscriptionStatus: sub?.status ?? null,
      subscriptionPlan: sub?.plan ?? null,
    }
  })
}

export type AdminQuestionRow = {
  id: string
  statement: string
  status: string
  difficulty: string
  author: string | null
  subject: string | null
  createdAt: string
}

export async function listAllQuestions(db: Db): Promise<AdminQuestionRow[]> {
  const { data } = await db
    .from('questions')
    .select(
      `id, statement, status, difficulty, created_at,
       author:author_profiles(display_name), subject:subjects(name)`,
    )
    .order('created_at', { ascending: false })

  return (data ?? []).map((q) => {
    const author = Array.isArray(q.author) ? q.author[0] : q.author
    const subject = Array.isArray(q.subject) ? q.subject[0] : q.subject
    return {
      id: q.id,
      statement: q.statement,
      status: q.status,
      difficulty: q.difficulty,
      author: author?.display_name ?? null,
      subject: subject?.name ?? null,
      createdAt: q.created_at,
    }
  })
}

export type UnpublishResult =
  | { ok: true }
  | { ok: false; code: 'not_found' | 'error'; message: string }

/** Remove a question from feed eligibility by setting status to unpublished. */
export async function unpublishQuestion(
  db: Db,
  questionId: string,
): Promise<UnpublishResult> {
  const { data, error } = await db
    .from('questions')
    .update({ status: 'unpublished' })
    .eq('id', questionId)
    .select('id')
    .maybeSingle()

  if (error) return { ok: false, code: 'error', message: error.message }
  if (!data) return { ok: false, code: 'not_found', message: 'question not found' }
  return { ok: true }
}

// =========================================================================
// Authors
// =========================================================================

export type AdminAuthorRow = {
  id: string
  userId: string
  displayName: string
  email: string | null
  shortBio: string | null
  instagram: string | null
  isPublic: boolean
  questionCount: number
  createdAt: string
}

/** List authors with their profile and a published-question count. */
export async function listAuthors(db: Db): Promise<AdminAuthorRow[]> {
  const { data: authors } = await db
    .from('author_profiles')
    .select(
      `id, user_id, display_name, short_bio, instagram, is_public, created_at,
       user:user_profiles(email)`,
    )
    .order('created_at', { ascending: false })

  if (!authors) return []

  const { data: questions } = await db
    .from('questions')
    .select('author_id, status')
    .eq('status', 'published')

  const publishedByAuthor = new Map<string, number>()
  for (const q of questions ?? []) {
    publishedByAuthor.set(q.author_id, (publishedByAuthor.get(q.author_id) ?? 0) + 1)
  }

  return authors.map((a) => {
    const user = Array.isArray(a.user) ? a.user[0] : a.user
    return {
      id: a.id,
      userId: a.user_id,
      displayName: a.display_name,
      email: user?.email ?? null,
      shortBio: a.short_bio,
      instagram: a.instagram,
      isPublic: a.is_public,
      questionCount: publishedByAuthor.get(a.id) ?? 0,
      createdAt: a.created_at,
    }
  })
}

export type CreateAuthorResult =
  | { ok: true; authorId: string; userId: string }
  | { ok: false; code: 'conflict' | 'error'; message: string }

/**
 * Provision a new author end-to-end. Requires the SERVICE-ROLE client: it calls
 * the Auth Admin API and writes profile rows that bypass RLS.
 *
 * Steps: create the auth user, set the profile role to `author`, then create
 * the author profile. If a later step fails, the created auth user is deleted so
 * a retry starts clean (manual rollback — there is no cross-service transaction).
 */
export async function createAuthor(
  serviceDb: Db,
  input: CreateAuthorInput,
): Promise<CreateAuthorResult> {
  const { data: created, error: authError } = await serviceDb.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { name: input.name, role: 'author' },
  })

  if (authError || !created.user) {
    const message = authError?.message ?? 'could not create auth user'
    const isConflict = /already.*regist|exist/i.test(message)
    return { ok: false, code: isConflict ? 'conflict' : 'error', message }
  }

  const userId = created.user.id

  const { error: profileError } = await serviceDb.from('user_profiles').upsert({
    id: userId,
    email: input.email,
    name: input.name,
    role: 'author',
  })
  if (profileError) {
    await serviceDb.auth.admin.deleteUser(userId)
    return { ok: false, code: 'error', message: profileError.message }
  }

  const { data: author, error: authorError } = await serviceDb
    .from('author_profiles')
    .insert({
      user_id: userId,
      display_name: input.display_name,
      short_bio: input.short_bio ?? null,
      instagram: input.instagram ?? null,
    })
    .select('id')
    .single()

  if (authorError || !author) {
    await serviceDb.auth.admin.deleteUser(userId)
    return {
      ok: false,
      code: 'error',
      message: authorError?.message ?? 'could not create author profile',
    }
  }

  return { ok: true, authorId: author.id, userId }
}
