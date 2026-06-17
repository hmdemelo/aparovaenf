import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/db/database.types'
import type {
  CreateAuthorInput,
  UpdateAuthorProfileInput,
} from '@/lib/validation/schemas'

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
  subscriptionPeriodEnd: string | null
  registrationCompleted: boolean
  forcePasswordChange: boolean
  answeredCount: number
}

export type AdminUserStatus = {
  label:
    | 'cadastro não concluído'
    | 'cadastro free'
    | 'assinatura ativa'
    | 'pagamento pendente'
    | 'pagamento em atraso'
    | 'assinatura cancelada'
    | 'assinatura expirada'
  className: string
}

export function resolveAdminUserStatus(input: {
  registrationCompleted: boolean
  subscriptionStatus: string | null
}): AdminUserStatus {
  if (!input.registrationCompleted) {
    return {
      label: 'cadastro não concluído',
      className: 'bg-amber-50 text-amber-700 border border-amber-200/60',
    }
  }

  if (input.subscriptionStatus === 'active') {
    return {
      label: 'assinatura ativa',
      className:
        'bg-[var(--teal-light)] text-[var(--teal-ink)] border border-[rgba(0,84,64,0.12)]',
    }
  }

  if (input.subscriptionStatus === 'pending') {
    return {
      label: 'pagamento pendente',
      className: 'bg-amber-50 text-amber-700 border border-amber-200/60',
    }
  }

  if (input.subscriptionStatus === 'past_due') {
    return {
      label: 'pagamento em atraso',
      className: 'bg-red-50 text-red-700 border border-red-200/60',
    }
  }

  if (input.subscriptionStatus === 'canceled') {
    return {
      label: 'assinatura cancelada',
      className: 'bg-slate-100 text-slate-700 border border-slate-200/60',
    }
  }

  if (input.subscriptionStatus === 'expired') {
    return {
      label: 'assinatura expirada',
      className: 'bg-slate-100 text-slate-700 border border-slate-200/60',
    }
  }

  return {
    label: 'cadastro free',
    className: 'bg-slate-100 text-slate-700 border border-slate-200/60',
  }
}

export async function listUsers(db: Db): Promise<AdminUserRow[]> {
  const [
    { data: users, error: usersError },
    { data: subs, error: subscriptionsError },
    { data: attempts, error: attemptsError },
  ] = await Promise.all([
    db
      .from('user_profiles')
      .select(
        'id, name, email, role, created_at, registration_completed, force_password_change',
      )
      .order('created_at', { ascending: false }),
    db
      .from('subscriptions')
      .select(
        'user_id, status, plan, current_period_end, created_at',
      )
      .order('created_at', { ascending: false }),
    db
      .from('answer_attempts')
      .select('user_id')
      .not('user_id', 'is', null),
  ])

  if (usersError) throw usersError
  if (subscriptionsError) throw subscriptionsError
  if (attemptsError) throw attemptsError

  const subscriptionPriority: Record<string, number> = {
    active: 5,
    past_due: 4,
    pending: 3,
    canceled: 2,
    expired: 1,
  }
  const subscriptionByUser = new Map<string, (typeof subs)[number]>()
  for (const subscription of subs ?? []) {
    const current = subscriptionByUser.get(subscription.user_id)
    if (
      !current ||
      (subscriptionPriority[subscription.status] ?? 0) >
        (subscriptionPriority[current.status] ?? 0)
    ) {
      subscriptionByUser.set(subscription.user_id, subscription)
    }
  }

  const answeredByUser = new Map<string, number>()
  for (const attempt of attempts ?? []) {
    if (!attempt.user_id) continue
    answeredByUser.set(
      attempt.user_id,
      (answeredByUser.get(attempt.user_id) ?? 0) + 1,
    )
  }

  return (users ?? []).map((u) => {
    const sub = subscriptionByUser.get(u.id)
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.created_at,
      subscriptionStatus: sub?.status ?? null,
      subscriptionPlan: sub?.plan ?? null,
      subscriptionPeriodEnd: sub?.current_period_end ?? null,
      registrationCompleted: u.registration_completed,
      forcePasswordChange: u.force_password_change,
      answeredCount: answeredByUser.get(u.id) ?? 0,
    }
  })
}

export type AdminQuestionRow = {
  id: string
  statement: string
  status: string
  difficulty: string | null
  author: string | null
  subject: string | null
  board: string | null
  createdAt: string
}

export type ListQuestionsOptions = {
  limit?: number
  page?: number
  search?: string
  status?: 'draft' | 'published' | 'unpublished' | 'archived'
  subjectId?: string
  boardId?: string
}

export type AdminQuestionsPage = {
  questions: AdminQuestionRow[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export async function listQuestionsPage(
  db: Db,
  options?: ListQuestionsOptions,
): Promise<AdminQuestionsPage> {
  let query = db
    .from('questions')
    .select(
      `id, statement, status, difficulty, created_at,
       author:author_profiles(display_name), subject:subjects(name),
       board:boards(name)`,
      { count: 'exact' },
    )

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.subjectId) {
    query = query.eq('subject_id', options.subjectId)
  }

  if (options?.boardId) {
    query = query.eq('board_id', options.boardId)
  }

  if (options?.search) {
    query = query.ilike('statement', `%${options.search}%`)
  }

  const pageSize = Math.min(Math.max(options?.limit ?? 30, 1), 30)
  const page = Math.max(options?.page ?? 1, 1)
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query
    .order('created_at', { ascending: false })
    .range(from, to)

  const { data, error, count } = await query
  if (error) throw error

  const questions = (data ?? []).map((q) => {
    const author = Array.isArray(q.author) ? q.author[0] : q.author
    const subject = Array.isArray(q.subject) ? q.subject[0] : q.subject
    const board = Array.isArray(q.board) ? q.board[0] : q.board
    return {
      id: q.id,
      statement: q.statement,
      status: q.status,
      difficulty: q.difficulty,
      author: author?.display_name ?? null,
      subject: subject?.name ?? null,
      board: board?.name ?? null,
      createdAt: q.created_at,
    }
  })

  const total = count ?? questions.length
  return {
    questions,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
    },
  }
}

export async function listAllQuestions(
  db: Db,
  options?: ListQuestionsOptions,
): Promise<AdminQuestionRow[]> {
  const result = await listQuestionsPage(db, options)
  return result.questions
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

export type UpdateAuthorProfileResult =
  | { ok: true; author: AdminAuthorRow }
  | { ok: false; code: 'not_found' | 'error'; message: string }

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
    registration_completed: true,
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

/** Update editable author profile fields. E-mail/password stay outside this flow. */
export async function updateAuthorProfile(
  db: Db,
  authorId: string,
  input: UpdateAuthorProfileInput,
): Promise<UpdateAuthorProfileResult> {
  const { data, error } = await db
    .from('author_profiles')
    .update({
      display_name: input.display_name,
      short_bio: input.short_bio ?? null,
      instagram: input.instagram ?? null,
      is_public: input.is_public,
    })
    .eq('id', authorId)
    .select(
      `id, user_id, display_name, short_bio, instagram, is_public, created_at,
       user:user_profiles(email)`,
    )
    .maybeSingle()

  if (error) return { ok: false, code: 'error', message: error.message }
  if (!data) {
    return { ok: false, code: 'not_found', message: 'author not found' }
  }

  const user = Array.isArray(data.user) ? data.user[0] : data.user
  return {
    ok: true,
    author: {
      id: data.id,
      userId: data.user_id,
      displayName: data.display_name,
      email: user?.email ?? null,
      shortBio: data.short_bio,
      instagram: data.instagram,
      isPublic: data.is_public,
      questionCount: 0,
      createdAt: data.created_at,
    },
  }
}

// =========================================================================
// Deletion
// =========================================================================

/** Subscription statuses that still bill the customer at Stripe. */
const BILLABLE_SUBSCRIPTION_STATUSES = ['active', 'past_due'] as const

export type DeleteUserResult =
  | { ok: true }
  | {
      ok: false
      code: 'active_subscription' | 'has_questions' | 'not_found' | 'error'
      message: string
    }

/**
 * Delete a user end-to-end. Requires the SERVICE-ROLE client.
 *
 * Guards before touching anything:
 * - Blocks while a billable Stripe subscription (active/past_due) exists, so the
 *   account is not removed under the recurring charge. The admin must cancel at
 *   Stripe first.
 * - Blocks authors who still own questions; those go through deleteAuthor, which
 *   can reassign or remove the questions deliberately.
 *
 * The actual removal goes through the Auth Admin API; the auth.users ->
 * user_profiles cascade then clears the profile and everything below it.
 */
export async function deleteUser(
  serviceDb: Db,
  userId: string,
): Promise<DeleteUserResult> {
  const { data: profile, error: profileError } = await serviceDb
    .from('user_profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (profileError) {
    return { ok: false, code: 'error', message: profileError.message }
  }
  if (!profile) {
    return { ok: false, code: 'not_found', message: 'user profile not found' }
  }

  const { data: billable, error: subscriptionError } = await serviceDb
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .in('status', [...BILLABLE_SUBSCRIPTION_STATUSES])
    .limit(1)
    .maybeSingle()

  if (subscriptionError) {
    return { ok: false, code: 'error', message: subscriptionError.message }
  }
  if (billable) {
    return {
      ok: false,
      code: 'active_subscription',
      message:
        'O usuário possui uma assinatura ativa no Stripe. Cancele a assinatura no Stripe antes de deletar para evitar cobranças indevidas.',
    }
  }

  const { data: author, error: authorError } = await serviceDb
    .from('author_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (authorError) {
    return { ok: false, code: 'error', message: authorError.message }
  }
  if (author) {
    const { count, error: questionsError } = await serviceDb
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', author.id)

    if (questionsError) {
      return { ok: false, code: 'error', message: questionsError.message }
    }
    if ((count ?? 0) > 0) {
      return {
        ok: false,
        code: 'has_questions',
        message:
          'Este usuário é um autor com questões cadastradas. Use a exclusão de autor para reatribuir ou remover as questões.',
      }
    }
  }

  const { error: deleteError } = await serviceDb.auth.admin.deleteUser(userId)
  if (deleteError) {
    return { ok: false, code: 'error', message: deleteError.message }
  }

  return { ok: true }
}

export type DeleteAuthorResult =
  | { ok: true }
  | {
      ok: false
      code:
        | 'active_subscription'
        | 'has_questions'
        | 'invalid_transfer'
        | 'not_found'
        | 'error'
      message: string
    }

export type DeleteAuthorInput = {
  /** When set, questions are reassigned to this author before deletion. */
  transferToAuthorId?: string
  /** When true, the author's questions (and their data) are removed. */
  deleteQuestions?: boolean
}

/**
 * Delete an author. Requires the SERVICE-ROLE client.
 *
 * Order of operations:
 * 1. Block if the author's account still carries a billable subscription.
 * 2. If transferToAuthorId is given, reassign questions to that author (the
 *    questions and all student history stay intact).
 * 3. Run the transactional RPC, which removes the author profile and — when
 *    deleteQuestions is true — the questions, alternatives, answer attempts and
 *    favorites attached to them, all in a single atomic statement.
 * 4. Delete the auth user (cascade clears user_profiles; author_profiles is
 *    already gone from the RPC).
 */
export async function deleteAuthor(
  serviceDb: Db,
  authorId: string,
  input: DeleteAuthorInput = {},
): Promise<DeleteAuthorResult> {
  const { data: author, error: authorError } = await serviceDb
    .from('author_profiles')
    .select('id, user_id')
    .eq('id', authorId)
    .maybeSingle()

  if (authorError) {
    return { ok: false, code: 'error', message: authorError.message }
  }
  if (!author) {
    return { ok: false, code: 'not_found', message: 'author not found' }
  }

  const { data: billable, error: subscriptionError } = await serviceDb
    .from('subscriptions')
    .select('id')
    .eq('user_id', author.user_id)
    .in('status', [...BILLABLE_SUBSCRIPTION_STATUSES])
    .limit(1)
    .maybeSingle()

  if (subscriptionError) {
    return { ok: false, code: 'error', message: subscriptionError.message }
  }
  if (billable) {
    return {
      ok: false,
      code: 'active_subscription',
      message:
        'O autor possui uma assinatura ativa no Stripe. Cancele a assinatura no Stripe antes de deletar para evitar cobranças indevidas.',
    }
  }

  if (input.transferToAuthorId) {
    if (input.transferToAuthorId === authorId) {
      return {
        ok: false,
        code: 'invalid_transfer',
        message: 'Não é possível reatribuir as questões para o próprio autor.',
      }
    }

    const { data: target, error: targetError } = await serviceDb
      .from('author_profiles')
      .select('id')
      .eq('id', input.transferToAuthorId)
      .maybeSingle()

    if (targetError) {
      return { ok: false, code: 'error', message: targetError.message }
    }
    if (!target) {
      return {
        ok: false,
        code: 'invalid_transfer',
        message: 'Autor de destino não encontrado.',
      }
    }

    const { error: transferError } = await serviceDb
      .from('questions')
      .update({ author_id: input.transferToAuthorId })
      .eq('author_id', authorId)

    if (transferError) {
      return { ok: false, code: 'error', message: transferError.message }
    }
  }

  const { error: rpcError } = await serviceDb.rpc('delete_author_cascade', {
    p_author_id: authorId,
    p_delete_questions: input.deleteQuestions ?? false,
  })

  if (rpcError) {
    // 23503 is raised by the RPC when the author still owns questions and the
    // caller did not opt into deleting or reassigning them.
    if (rpcError.code === '23503') {
      return {
        ok: false,
        code: 'has_questions',
        message:
          'O autor ainda possui questões. Reatribua-as a outro autor ou confirme a exclusão das questões.',
      }
    }
    return { ok: false, code: 'error', message: rpcError.message }
  }

  const { error: deleteError } = await serviceDb.auth.admin.deleteUser(
    author.user_id,
  )
  if (deleteError) {
    return { ok: false, code: 'error', message: deleteError.message }
  }

  return { ok: true }
}

export type ChangePasswordResult =
  | { ok: true }
  | { ok: false; code: 'not_found' | 'error'; message: string }

/** Update a user's password using the service role client and set force_password_change = true. */
export async function adminChangeUserPassword(
  serviceDb: Db,
  userId: string,
  input: { password: string },
): Promise<ChangePasswordResult> {
  const { data: profile, error: profileError } = await serviceDb
    .from('user_profiles')
    .update({ force_password_change: true })
    .eq('id', userId)
    .select('id')
    .maybeSingle()

  if (profileError) {
    return { ok: false, code: 'error', message: profileError.message }
  }
  if (!profile) {
    return {
      ok: false,
      code: 'not_found',
      message: 'user profile not found',
    }
  }

  const { error: authError } = await serviceDb.auth.admin.updateUserById(
    userId,
    { password: input.password },
  )
  if (authError) {
    const { error: rollbackError } = await serviceDb
      .from('user_profiles')
      .update({ force_password_change: false })
      .eq('id', userId)
    if (rollbackError) {
      console.error(
        '[admin.password] failed to rollback forced change flag',
        rollbackError,
      )
    }
    return { ok: false, code: 'error', message: authError.message }
  }

  return { ok: true }
}
