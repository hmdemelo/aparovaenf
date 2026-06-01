import { z } from 'zod'

/**
 * Shared validation schemas and domain enums for aprovaenf.
 *
 * These mirror the database enums defined in `supabase/migrations/001_core.sql`
 * and the entity rules in `specs/001-aprovaenf-mvp/data-model.md`. Keep both
 * sides in sync when changing a value.
 */

// --- Domain enums ---------------------------------------------------------

export const userRoles = ['student', 'author', 'admin'] as const
export const userRoleSchema = z.enum(userRoles)
export type UserRole = z.infer<typeof userRoleSchema>

export const difficulties = ['facil', 'media', 'dificil'] as const
export const difficultySchema = z.enum(difficulties)
export type Difficulty = z.infer<typeof difficultySchema>

export const sourceTypes = ['autoral', 'prova_oficial'] as const
export const sourceTypeSchema = z.enum(sourceTypes)
export type SourceType = z.infer<typeof sourceTypeSchema>

export const questionStatuses = [
  'draft',
  'published',
  'unpublished',
  'archived',
] as const
export const questionStatusSchema = z.enum(questionStatuses)
export type QuestionStatus = z.infer<typeof questionStatusSchema>

export const plans = ['monthly', 'annual'] as const
export const planSchema = z.enum(plans)
export type Plan = z.infer<typeof planSchema>

export const subscriptionStatuses = [
  'pending',
  'active',
  'past_due',
  'canceled',
  'expired',
] as const
export const subscriptionStatusSchema = z.enum(subscriptionStatuses)
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>

// --- Feed and answers -----------------------------------------------------

// Lenient UUID/GUID shape (8-4-4-4-12 hex). We intentionally do not enforce the
// RFC 4122 version/variant nibbles: these are opaque database identifiers, the
// Postgres `uuid` type guarantees integrity, and fixed seed ids are not v4.
export const uuidSchema = z
  .string()
  .regex(
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
    'must be a UUID',
  )

export const feedQuerySchema = z.object({
  career: z.string().min(1, 'career is required'),
  board: z.string().min(1).optional(),
})
export type FeedQuery = z.infer<typeof feedQuerySchema>

export const answerInputSchema = z.object({
  question_id: uuidSchema,
  alternative_id: uuidSchema,
  anonymous_session_id: uuidSchema.optional(),
})
export type AnswerInput = z.infer<typeof answerInputSchema>

// --- Author question authoring -------------------------------------------

export const alternativeInputSchema = z.object({
  label: z.string().min(1).max(8),
  text: z.string().min(1, 'alternative text is required'),
  is_correct: z.boolean(),
  alternative_comment: z.string().optional(),
  position: z.number().int().nonnegative(),
})
export type AlternativeInput = z.infer<typeof alternativeInputSchema>

/**
 * Schema for creating or editing a draft question. Publish-time invariants
 * (general comment present, >=2 alternatives, exactly one correct) are enforced
 * separately by the publish validation in features/questions.
 */
export const questionInputSchema = z.object({
  career_id: uuidSchema,
  subject_id: uuidSchema,
  board_id: uuidSchema.optional(),
  difficulty: difficultySchema,
  source_type: sourceTypeSchema,
  source_orgao: z.string().optional(),
  source_cargo: z.string().optional(),
  source_year: z.number().int().min(1900).max(2100).optional(),
  source_reference: z.string().optional(),
  statement: z.string().min(1, 'statement is required'),
  general_comment: z.string().optional(),
  alternatives: z.array(alternativeInputSchema).optional(),
})
export type QuestionInput = z.infer<typeof questionInputSchema>

// --- Billing --------------------------------------------------------------

export const checkoutInputSchema = z.object({
  plan: planSchema,
})
export type CheckoutInput = z.infer<typeof checkoutInputSchema>

// --- Favorites ------------------------------------------------------------

export const favoriteInputSchema = z.object({
  question_id: uuidSchema,
})
export type FavoriteInput = z.infer<typeof favoriteInputSchema>
