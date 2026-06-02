import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/db/database.types'
import { loadLocalEnv } from './helpers/local-env'
import {
  listUsers,
  listAllQuestions,
  unpublishQuestion,
} from '@/features/admin/admin-service'
import { getNextQuestion } from '@/features/questions/question-repository'

const hasLocal = loadLocalEnv()
const seedPassword = process.env.SEED_DEMO_PASSWORD
const d = hasLocal && seedPassword ? describe : describe.skip

// f8 (tecnico-em-enfermagem) is unpublished then restored so the feed for that
// career is left as the seed defined it.
const Q_TECNICO = '00000000-0000-0000-0000-0000000000f8'
const Q_TECNICO_OTHER = '00000000-0000-0000-0000-0000000000f7'

async function signIn(email: string) {
  const client = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  )
  const { error } = await client.auth.signInWithPassword({
    email,
    password: seedPassword!,
  })
  if (error) throw new Error(`sign-in failed for ${email}: ${error.message}`)
  return client
}

d('admin operations (local Supabase)', () => {
  let admin: SupabaseClient<Database>
  let author: SupabaseClient<Database>
  let service: SupabaseClient<Database>

  beforeAll(async () => {
    service = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    )
    admin = await signIn('admin@aprovaenf.local')
    author = await signIn('autor1@aprovaenf.local')
  })

  afterAll(async () => {
    // Restore f8 to published so the feed is unchanged for other suites.
    if (service) {
      await service
        .from('questions')
        .update({ status: 'published' })
        .eq('id', Q_TECNICO)
    }
  })

  it('lets an admin list all users', async () => {
    const users = await listUsers(admin)
    expect(users.length).toBeGreaterThanOrEqual(5)
    expect(users.some((u) => u.role === 'admin')).toBe(true)
    expect(users.some((u) => u.subscriptionStatus === 'active')).toBe(true)
  })

  it('lets an admin see questions in any status', async () => {
    const questions = await listAllQuestions(admin)
    expect(questions.length).toBeGreaterThanOrEqual(8)
  })

  it('unpublishes a question and removes it from feed eligibility', async () => {
    const result = await unpublishQuestion(admin, Q_TECNICO)
    expect(result.ok).toBe(true)

    const { data } = await service
      .from('questions')
      .select('status')
      .eq('id', Q_TECNICO)
      .single()
    expect(data!.status).toBe('unpublished')

    // Only f7 and f8 are published for tecnico; with f8 unpublished and f7
    // excluded, the feed must return nothing.
    const next = await getNextQuestion(service, {
      careerSlug: 'tecnico-em-enfermagem',
      excludeIds: [Q_TECNICO_OTHER],
    })
    expect(next).toBeNull()
  })

  it('scopes a non-admin to their own user row (RLS)', async () => {
    const users = await listUsers(author)
    // RLS lets a non-admin read only their own profile.
    expect(users).toHaveLength(1)
    expect(users[0].role).toBe('author')
  })
})
