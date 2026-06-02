import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/db/database.types'

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
