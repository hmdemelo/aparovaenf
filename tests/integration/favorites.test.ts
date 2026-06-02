import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/db/database.types'
import { loadLocalEnv } from './helpers/local-env'
import {
  addFavorite,
  listFavorites,
  removeFavorite,
} from '@/features/student-feed/favorites-service'
import { listErrorHistory } from '@/features/student-feed/error-history-service'

const hasLocal = loadLocalEnv()
const seedPassword = process.env.SEED_DEMO_PASSWORD
const d = hasLocal && seedPassword ? describe : describe.skip

const Q1 = '00000000-0000-0000-0000-0000000000f1'
const Q2 = '00000000-0000-0000-0000-0000000000f2'

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

d('favorites & error history (local Supabase)', () => {
  let subscriber: SupabaseClient<Database>
  let nonSubscriber: SupabaseClient<Database>
  let service: SupabaseClient<Database>
  let subscriberId: string
  let nonSubscriberId: string

  beforeAll(async () => {
    service = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    )
    subscriber = await signIn('assinante@aprovaenf.local')
    nonSubscriber = await signIn('aluno@aprovaenf.local')
    subscriberId = (await subscriber.auth.getUser()).data.user!.id
    nonSubscriberId = (await nonSubscriber.auth.getUser()).data.user!.id
  })

  afterAll(async () => {
    if (service) {
      await service.from('favorites').delete().in('user_id', [subscriberId, nonSubscriberId])
      await service.from('answer_attempts').delete().in('user_id', [subscriberId, nonSubscriberId])
    }
  })

  it('lets an active subscriber persist and list a favorite', async () => {
    const result = await addFavorite(subscriber, subscriberId, Q1)
    expect(result.ok).toBe(true)

    const list = await listFavorites(subscriber, subscriberId)
    expect(list.map((f) => f.questionId)).toContain(Q1)
  })

  it('removes a favorite', async () => {
    await addFavorite(subscriber, subscriberId, Q2)
    const removed = await removeFavorite(subscriber, subscriberId, Q2)
    expect(removed.ok).toBe(true)

    const list = await listFavorites(subscriber, subscriberId)
    expect(list.map((f) => f.questionId)).not.toContain(Q2)
  })

  it('blocks a non-subscriber from persisting a favorite (RLS)', async () => {
    const result = await addFavorite(nonSubscriber, nonSubscriberId, Q1)
    expect(result.ok).toBe(false)

    // Confirm nothing was persisted for the non-subscriber.
    const { data } = await service
      .from('favorites')
      .select('id')
      .eq('user_id', nonSubscriberId)
    expect(data ?? []).toHaveLength(0)
  })

  it('returns the subscriber’s incorrect answers in error history', async () => {
    const { data: alt } = await service
      .from('alternatives')
      .select('id')
      .eq('question_id', Q2)
      .limit(1)
      .single()

    await service.from('answer_attempts').insert({
      user_id: subscriberId,
      question_id: Q2,
      selected_alternative_id: alt!.id,
      is_correct: false,
    })

    const history = await listErrorHistory(subscriber, subscriberId)
    expect(history.map((h) => h.questionId)).toContain(Q2)
    expect(history.find((h) => h.questionId === Q2)!.generalComment).toBeTruthy()
  })
})
