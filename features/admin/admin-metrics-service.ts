import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/db/database.types'
import {
  ProductEventNames,
  type ProductEventName,
} from '@/features/analytics/product-events'
import type { QuestionStatus, UserRole } from '@/lib/validation/schemas'

type Db = SupabaseClient<Database>

/**
 * Admin metrics: basic launch-funnel and content counts. Runs under the admin's
 * RLS (is_admin() policies on user_profiles, subscriptions, questions,
 * product_events). Uses head/count queries to avoid loading rows.
 */

export type AdminMetrics = {
  users: { total: number; students: number; authors: number; admins: number }
  subscriptions: { active: number }
  questions: { total: number; published: number; draft: number; unpublished: number }
  funnel: Record<string, number>
}

const FUNNEL_EVENTS: ProductEventName[] = [
  ProductEventNames.LANDING_VIEWED,
  ProductEventNames.CAREER_SELECTED,
  ProductEventNames.QUESTION_ANSWERED,
  ProductEventNames.SIGNUP_REQUIRED_SHOWN,
  ProductEventNames.SIGNUP_COMPLETED,
  ProductEventNames.TRIAL_FINISHED,
  ProductEventNames.CHECKOUT_STARTED,
  ProductEventNames.SUBSCRIPTION_ACTIVATED,
]

async function countUsersByRole(db: Db, role: UserRole): Promise<number> {
  const { count } = await db
    .from('user_profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', role)
  return count ?? 0
}

async function countQuestionsByStatus(
  db: Db,
  status: QuestionStatus,
): Promise<number> {
  const { count } = await db
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .eq('status', status)
  return count ?? 0
}

async function countEvents(db: Db, name: ProductEventName): Promise<number> {
  const { count } = await db
    .from('product_events')
    .select('id', { count: 'exact', head: true })
    .eq('event_name', name)
  return count ?? 0
}

export async function getAdminMetrics(db: Db): Promise<AdminMetrics> {
  const [totalUsers, students, authors, admins] = await Promise.all([
    db.from('user_profiles').select('id', { count: 'exact', head: true }),
    countUsersByRole(db, 'student'),
    countUsersByRole(db, 'author'),
    countUsersByRole(db, 'admin'),
  ])

  const [activeSubs] = await Promise.all([
    db
      .from('subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),
  ])

  const [totalQuestions, published, draft, unpublished] = await Promise.all([
    db.from('questions').select('id', { count: 'exact', head: true }),
    countQuestionsByStatus(db, 'published'),
    countQuestionsByStatus(db, 'draft'),
    countQuestionsByStatus(db, 'unpublished'),
  ])

  const funnelCounts = await Promise.all(
    FUNNEL_EVENTS.map((name) => countEvents(db, name)),
  )
  const funnel: Record<string, number> = {}
  FUNNEL_EVENTS.forEach((name, i) => {
    funnel[name] = funnelCounts[i]
  })

  return {
    users: {
      total: totalUsers.count ?? 0,
      students,
      authors,
      admins,
    },
    subscriptions: { active: activeSubs.count ?? 0 },
    questions: {
      total: totalQuestions.count ?? 0,
      published,
      draft,
      unpublished,
    },
    funnel,
  }
}
