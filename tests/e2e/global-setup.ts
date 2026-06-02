import { createClient } from '@supabase/supabase-js'
import { loadLocalEnv } from '../integration/helpers/local-env'

// Demo student users whose trial/favorites data must start clean each run so
// E2E flows are deterministic (the non-subscriber must not hit the paywall from
// answers accumulated in previous runs).
const DEMO_STUDENT_IDS = [
  '00000000-0000-0000-0000-0000000000a4', // aluno (no subscription)
  '00000000-0000-0000-0000-0000000000a5', // assinante (active subscription)
]

// Seed questions f1..f8 — restored to published so the admin-moderation E2E
// (which unpublishes one) and the feed start from a known state each run.
const SEED_QUESTION_IDS = Array.from(
  { length: 8 },
  (_, i) => `00000000-0000-0000-0000-0000000000f${i + 1}`,
)

export default async function globalSetup() {
  if (!loadLocalEnv()) return
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return

  const db = createClient(url, key, { auth: { persistSession: false } })
  await db.from('favorites').delete().in('user_id', DEMO_STUDENT_IDS)
  await db.from('answer_attempts').delete().in('user_id', DEMO_STUDENT_IDS)
  await db
    .from('questions')
    .update({ status: 'published' })
    .in('id', SEED_QUESTION_IDS)
}
