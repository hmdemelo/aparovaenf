import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/db/database.types'
import { loadLocalEnv } from './helpers/local-env'
import { deleteUser, deleteAuthor } from '@/features/admin/admin-service'

const hasLocal = loadLocalEnv()
const seedPassword = process.env.SEED_DEMO_PASSWORD
const d = hasLocal && seedPassword ? describe : describe.skip

// ─── Seed UUIDs kept stable so tests are deterministic ──────────────────────
//
// These users/authors are created in beforeAll and torn down in afterAll.
// UUIDs start with 'dddd' to avoid collisions with existing seed fixtures.

const DELETABLE_STUDENT_ID = '00000000-dddd-0000-0000-000000000001'
const DELETABLE_AUTHOR_NO_Q_ID = '00000000-dddd-0000-0000-000000000002'
const DELETABLE_AUTHOR_WITH_Q_ID = '00000000-dddd-0000-0000-000000000003'
const TRANSFER_TARGET_AUTHOR_ID = '00000000-dddd-0000-0000-000000000004'

// Unique per run so an interrupted previous run cannot leave an auth user
// holding the email while the fixed test UUID is still missing.
const RUN_TAG = Date.now()
function makeEmail(tag: string) {
  return `delete-test-${tag}-${RUN_TAG}@aprovaenf.local`
}

d('admin delete operations (local Supabase)', () => {
  let service: SupabaseClient<Database>

  // author_profile.id values returned after insert (may differ from user_id)
  let authorNoQProfileId: string
  let authorWithQProfileId: string
  let transferTargetProfileId: string

  // question created under authorWithQ for the "has_questions" guard
  let testQuestionId: string

  // ── helpers ──────────────────────────────────────────────────────────────

  async function createTestUser(
    userId: string,
    email: string,
    role: 'student' | 'author' | 'admin' = 'student',
  ) {
    const { error } = await service.auth.admin.createUser({
      id: userId,
      email,
      password: seedPassword!,
      email_confirm: true,
      user_metadata: { id: userId },
    })
    if (error && !error.message.includes('already')) throw error

    // Upsert profile (auth trigger may have already created a row)
    const { error: profileError } = await service.from('user_profiles').upsert(
      { id: userId, role, registration_completed: true, name: email },
      { onConflict: 'id' },
    )
    if (profileError) throw profileError
  }

  async function createTestAuthor(userId: string, email: string) {
    await createTestUser(userId, email, 'author')
    const { data, error } = await service
      .from('author_profiles')
      .insert({ user_id: userId, display_name: email, is_public: false })
      .select('id')
      .single()
    if (error) throw error
    return data.id as string
  }

  async function seedQuestion(authorProfileId: string) {
    // Find any career/board/subject from seed to satisfy FK constraints
    const { data: career } = await service
      .from('careers')
      .select('id')
      .limit(1)
      .single()
    const { data: board } = await service
      .from('boards')
      .select('id')
      .limit(1)
      .single()
    const { data: subject } = await service
      .from('subjects')
      .select('id')
      .limit(1)
      .single()

    const { data: question, error } = await service
      .from('questions')
      .insert({
        author_id: authorProfileId,
        career_id: career!.id,
        board_id: board!.id,
        subject_id: subject!.id,
        statement: 'Test question for delete guard',
        general_comment: 'Test comment',
        difficulty: 'facil',
        status: 'draft',
      })
      .select('id')
      .single()
    if (error) throw error

    // Two alternatives (at least one correct) to satisfy question constraints
    await service.from('alternatives').insert([
      {
        question_id: question.id,
        label: 'A',
        text: 'Option A',
        is_correct: true,
      },
      {
        question_id: question.id,
        label: 'B',
        text: 'Option B',
        is_correct: false,
      },
    ])

    return question.id as string
  }

  async function nukeUser(userId: string) {
    // Best-effort cleanup; ignore errors (row may already be gone)
    await service.auth.admin.deleteUser(userId).catch(() => null)
  }

  // ── lifecycle ─────────────────────────────────────────────────────────────

  beforeAll(async () => {
    service = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    )

    await createTestUser(DELETABLE_STUDENT_ID, makeEmail('student'), 'student')

    authorNoQProfileId = await createTestAuthor(
      DELETABLE_AUTHOR_NO_Q_ID,
      makeEmail('author-no-q'),
    )

    authorWithQProfileId = await createTestAuthor(
      DELETABLE_AUTHOR_WITH_Q_ID,
      makeEmail('author-with-q'),
    )

    transferTargetProfileId = await createTestAuthor(
      TRANSFER_TARGET_AUTHOR_ID,
      makeEmail('transfer-target'),
    )

    testQuestionId = await seedQuestion(authorWithQProfileId)
  })

  afterAll(async () => {
    // Sweep remaining test fixtures (most will already be gone after the tests)
    for (const id of [
      DELETABLE_STUDENT_ID,
      DELETABLE_AUTHOR_NO_Q_ID,
      DELETABLE_AUTHOR_WITH_Q_ID,
      TRANSFER_TARGET_AUTHOR_ID,
    ]) {
      await nukeUser(id)
    }
  })

  // ── deleteUser ────────────────────────────────────────────────────────────

  describe('deleteUser', () => {
    it('returns not_found for a non-existent user', async () => {
      const result = await deleteUser(
        service,
        '00000000-dddd-0000-0000-000000000099',
      )
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.code).toBe('not_found')
    })

    it('blocks deletion when user has an active subscription', async () => {
      // Inject a fake active subscription directly (no Stripe needed)
      await service.from('subscriptions').insert({
        user_id: DELETABLE_STUDENT_ID,
        plan: 'monthly',
        status: 'active',
        provider: 'stripe',
        provider_subscription_id: 'sub_test_delete_guard',
      })

      const result = await deleteUser(service, DELETABLE_STUDENT_ID)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.code).toBe('active_subscription')

      // Clean up the fake subscription so the next test can succeed
      await service
        .from('subscriptions')
        .delete()
        .eq('provider_subscription_id', 'sub_test_delete_guard')
    })

    it('blocks deletion of an author who still has questions', async () => {
      const result = await deleteUser(service, DELETABLE_AUTHOR_WITH_Q_ID)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.code).toBe('has_questions')
    })

    it('deletes a plain student with no subscription or questions', async () => {
      const result = await deleteUser(service, DELETABLE_STUDENT_ID)
      expect(result.ok).toBe(true)

      const { data } = await service.auth.admin.getUserById(
        DELETABLE_STUDENT_ID,
      )
      expect(data.user).toBeNull()
    })
  })

  // ── deleteAuthor ──────────────────────────────────────────────────────────

  describe('deleteAuthor', () => {
    it('returns not_found for a non-existent author profile', async () => {
      const result = await deleteAuthor(
        service,
        '00000000-dddd-0000-0000-000000000099',
      )
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.code).toBe('not_found')
    })

    it('returns has_questions when author owns questions and no action given', async () => {
      const result = await deleteAuthor(service, authorWithQProfileId)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.code).toBe('has_questions')
    })

    it('returns invalid_transfer when transferToAuthorId equals the deleted author', async () => {
      const result = await deleteAuthor(service, authorWithQProfileId, {
        transferToAuthorId: authorWithQProfileId,
      })
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.code).toBe('invalid_transfer')
    })

    it('returns invalid_transfer when the target author does not exist', async () => {
      const result = await deleteAuthor(service, authorWithQProfileId, {
        transferToAuthorId: '00000000-dddd-0000-0000-000000000099',
      })
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.code).toBe('invalid_transfer')
    })

    it('deletes an author with no questions', async () => {
      const result = await deleteAuthor(service, authorNoQProfileId)
      expect(result.ok).toBe(true)

      const { data } = await service.auth.admin.getUserById(
        DELETABLE_AUTHOR_NO_Q_ID,
      )
      expect(data.user).toBeNull()
    })

    it('transfers questions to another author and deletes the author', async () => {
      // Confirm question still belongs to authorWithQ before the transfer
      const { data: before } = await service
        .from('questions')
        .select('author_id')
        .eq('id', testQuestionId)
        .single()
      expect(before!.author_id).toBe(authorWithQProfileId)

      const result = await deleteAuthor(service, authorWithQProfileId, {
        transferToAuthorId: transferTargetProfileId,
      })
      expect(result.ok).toBe(true)

      // Question must now belong to the target author
      const { data: after } = await service
        .from('questions')
        .select('author_id')
        .eq('id', testQuestionId)
        .single()
      expect(after!.author_id).toBe(transferTargetProfileId)

      // Deleted author's auth user must be gone
      const { data } = await service.auth.admin.getUserById(
        DELETABLE_AUTHOR_WITH_Q_ID,
      )
      expect(data.user).toBeNull()
    })

    it('deletes an author together with their questions', async () => {
      // Re-create the author and a new question so this test is self-contained
      const tmpUserId = '00000000-dddd-0000-0000-000000000005'
      const tmpAuthorProfileId = await createTestAuthor(
        tmpUserId,
        makeEmail('author-del-q'),
      )
      const tmpQuestionId = await seedQuestion(tmpAuthorProfileId)

      const result = await deleteAuthor(service, tmpAuthorProfileId, {
        deleteQuestions: true,
      })
      expect(result.ok).toBe(true)

      // Question must be gone
      const { data: qRow } = await service
        .from('questions')
        .select('id')
        .eq('id', tmpQuestionId)
        .maybeSingle()
      expect(qRow).toBeNull()

      // Auth user must be gone
      const { data } = await service.auth.admin.getUserById(tmpUserId)
      expect(data.user).toBeNull()
    })
  })
})
