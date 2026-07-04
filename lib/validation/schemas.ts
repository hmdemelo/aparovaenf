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

// --- Authentication -------------------------------------------------------

const AUTH_REDIRECT_FALLBACK = '/'
const AUTH_REDIRECT_BASE = 'https://aprovaenf.local'

export function normalizeAuthRedirectPath(
  value: string | null | undefined,
): string {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) {
    return AUTH_REDIRECT_FALLBACK
  }

  try {
    const parsed = new URL(raw, AUTH_REDIRECT_BASE)
    if (parsed.origin !== AUTH_REDIRECT_BASE) {
      return AUTH_REDIRECT_FALLBACK
    }

    const path = `${parsed.pathname}${parsed.search}${parsed.hash}`
    return path.startsWith('/') && !path.startsWith('//')
      ? path
      : AUTH_REDIRECT_FALLBACK
  } catch {
    return AUTH_REDIRECT_FALLBACK
  }
}

export function buildAuthCallbackUrl(
  origin: string,
  next: string | null | undefined,
): string {
  const callbackUrl = new URL('/api/auth/callback', origin)
  callbackUrl.searchParams.set('next', normalizeAuthRedirectPath(next))
  return callbackUrl.toString()
}

export const authEmailSchema = z
  .string()
  .trim()
  .email('Informe um e-mail válido.')

export const authRedirectPathSchema = z
  .string()
  .optional()
  .nullable()
  .transform(normalizeAuthRedirectPath)

export const authCallbackQuerySchema = z.object({
  code: z.string().trim().min(1).optional(),
  next: authRedirectPathSchema,
  error: z.string().trim().max(120).optional(),
  error_description: z.string().trim().max(240).optional(),
})
export type AuthCallbackQuery = z.infer<typeof authCallbackQuerySchema>

export const forcePasswordChangeInputSchema = z.object({
  password: z
    .string()
    .min(8, 'A senha deve ter pelo menos 8 caracteres.')
    .max(72, 'A senha deve ter no máximo 72 caracteres.'),
})
export type ForcePasswordChangeInput = z.infer<
  typeof forcePasswordChangeInputSchema
>

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
  subject: uuidSchema.optional(),
  // Specific question to (re)load, e.g. "Refazer" from the error list.
  question: uuidSchema.optional(),
  difficulty: difficultySchema.optional(),
  // Comma-separated tag ids, parsed into a list of uuids.
  tags: z
    .string()
    .optional()
    .transform((value) =>
      value
        ? value
            .split(',')
            .map((id) => id.trim())
            .filter(Boolean)
        : [],
    )
    .pipe(z.array(uuidSchema).max(20)),
})
export type FeedQuery = z.infer<typeof feedQuerySchema>

export const answerInputSchema = z.object({
  question_id: uuidSchema,
  alternative_id: uuidSchema,
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
  career_id: uuidSchema.optional().nullable(),
  subject_id: uuidSchema.optional().nullable(),
  board_id: uuidSchema.optional(),
  difficulty: difficultySchema.optional().nullable(),
  source_type: sourceTypeSchema,
  source_orgao: z.string().optional(),
  source_cargo: z.string().optional(),
  source_year: z.number().int().min(1900).max(2100).optional(),
  source_reference: z.string().optional(),
  statement: z.string().min(1, 'statement is required'),
  general_comment: z.string().optional(),
  alternatives: z.array(alternativeInputSchema).optional(),
  image_path: z.string().optional().nullable(),
})
export type QuestionInput = z.infer<typeof questionInputSchema>

// --- Author authoring input (from the editor UI) -------------------------

export const authorAlternativeSchema = z.object({
  label: z.string().min(1).max(8),
  text: z.string().min(1, 'alternative text is required'),
  is_correct: z.boolean(),
  alternative_comment: z.string().optional().nullable(),
})
export type AuthorAlternativeInput = z.infer<typeof authorAlternativeSchema>

/**
 * Author create/update payload. Looser than publish: a draft may be incomplete
 * (publish-time invariants are enforced by validateForPublish). `statement` is
 * always required so there is something to save.
 */
export const authorQuestionInputSchema = z.object({
  career_id: uuidSchema.optional().nullable(),
  subject_id: uuidSchema.optional().nullable(),
  board_id: uuidSchema.optional().nullable(),
  difficulty: difficultySchema.optional().nullable(),
  source_type: sourceTypeSchema.default('autoral'),
  source_orgao: z.string().optional().nullable(),
  source_cargo: z.string().optional().nullable(),
  source_year: z.number().int().min(1900).max(2100).optional().nullable(),
  source_reference: z.string().optional().nullable(),
  statement: z.string().min(1, 'statement is required'),
  general_comment: z.string().optional().nullable(),
  alternatives: z.array(authorAlternativeSchema).optional(),
  topic_ids: z.array(uuidSchema).max(20).optional(),
  image_path: z.string().optional().nullable(),
})
export type AuthorQuestionInput = z.infer<typeof authorQuestionInputSchema>

const catalogNameSchema = (requiredMessage: string) =>
  z.string()
    .trim()
    .min(1, requiredMessage)
    .max(120)
    .refine(
      (value) => /[\p{L}\p{N}]/u.test(value),
      'informe um nome com letras ou números',
    )

/** Inline board creation payload (author "+" quick-add). */
export const createBoardInputSchema = z.object({
  name: catalogNameSchema('nome da banca é obrigatório'),
})
export type CreateBoardInput = z.infer<typeof createBoardInputSchema>

// --- Admin: author creation ----------------------------------------------

/**
 * Admin payload to provision a new author. The admin sets a temporary password
 * the author can change later. `display_name` is what appears on questions and
 * the public authors section; the optional fields populate the author profile.
 */
export const createAuthorInputSchema = z.object({
  email: z.string().email('e-mail inválido'),
  password: z.string().min(8, 'a senha deve ter pelo menos 8 caracteres'),
  name: z.string().min(1, 'nome é obrigatório'),
  display_name: z.string().min(1, 'nome de exibição é obrigatório'),
  short_bio: z.string().max(280, 'bio muito longa').optional().nullable(),
  instagram: z.string().max(60).optional().nullable(),
})
export type CreateAuthorInput = z.infer<typeof createAuthorInputSchema>

export const updateAuthorProfileInputSchema = z.object({
  display_name: z
    .string()
    .trim()
    .min(1, 'nome de exibição é obrigatório')
    .max(120),
  short_bio: z.string().trim().max(280, 'bio muito longa').optional().nullable(),
  instagram: z.string().trim().max(60).optional().nullable(),
  is_public: z.boolean(),
})
export type UpdateAuthorProfileInput = z.infer<
  typeof updateAuthorProfileInputSchema
>

export const adminQuestionsQuerySchema = z.object({
  q: z.string().trim().max(160).optional(),
  status: questionStatusSchema.optional(),
  subject_id: uuidSchema.optional(),
  board_id: uuidSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(30).default(30),
})

// --- Admin: bulk question import -----------------------------------------

export const bulkImportRowErrorSchema = z.object({
  line: z.number().int().positive(),
  field: z.string().min(1),
  message: z.string().min(1),
})
export type BulkImportRowErrorInput = z.infer<typeof bulkImportRowErrorSchema>
export const bulkImportRowWarningSchema = bulkImportRowErrorSchema
export type BulkImportRowWarningInput = BulkImportRowErrorInput

export const bulkQuestionImportResultSchema = z.object({
  author_id: uuidSchema,
  file_name: z.string().min(1),
  total_rows: z.number().int().nonnegative(),
  imported: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  created_question_ids: z.array(uuidSchema.or(z.string().min(1))),
  errors: z.array(bulkImportRowErrorSchema),
  warnings: z.array(bulkImportRowWarningSchema),
})
export type BulkQuestionImportResultInput = z.infer<
  typeof bulkQuestionImportResultSchema
>

// --- Admin: subject creation ---------------------------------------------

/**
 * Admin payload to register a new subject under a career. `slug` is optional and
 * auto-derived from `name` (via slugify) when omitted; `career_id` is required so
 * the subject is always attached to a career.
 */
export const createSubjectInputSchema = z.object({
  career_id: uuidSchema,
  name: z.string().trim().min(1, 'nome é obrigatório').max(120),
  slug: z.string().trim().min(1).max(120).optional(),
})
export type CreateSubjectInput = z.infer<typeof createSubjectInputSchema>

// --- Account profile ------------------------------------------------------

export const accountProfileInputSchema = z.object({
  name: z.string().trim().min(1, 'nome é obrigatório').max(120),
  display_name: z
    .string()
    .trim()
    .min(1, 'nome de exibição é obrigatório')
    .max(120),
  short_bio: z.string().trim().max(280, 'bio muito longa').optional().nullable(),
  instagram: z.string().trim().max(60).optional().nullable(),
})
export type AccountProfileInput = z.infer<typeof accountProfileInputSchema>

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

// --- Author classification catalogs -------------------------------------

export const catalogQuerySchema = z.object({
  q: z.string().max(80).optional().nullable(),
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(200).default(20),
})
export type CatalogQuery = z.infer<typeof catalogQuerySchema>

export const disciplinesQuerySchema = catalogQuerySchema.extend({
  career_id: uuidSchema.optional().nullable(),
})
export type DisciplinesQuery = z.infer<typeof disciplinesQuerySchema>

export const topicsQuerySchema = catalogQuerySchema.extend({
  discipline_id: uuidSchema.optional().nullable(),
})
export type TopicsQuery = z.infer<typeof topicsQuerySchema>

export const createDisciplineInputSchema = z.object({
  name: catalogNameSchema('nome da disciplina é obrigatório'),
  career_id: uuidSchema,
})
export type CreateDisciplineInput = z.infer<typeof createDisciplineInputSchema>

export const createTopicInputSchema = z.object({
  name: catalogNameSchema('nome do assunto é obrigatório'),
  discipline_id: uuidSchema,
})
export type CreateTopicInput = z.infer<typeof createTopicInputSchema>
