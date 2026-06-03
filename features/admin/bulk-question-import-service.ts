import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/db/database.types'
import type {
  BulkImportRowError,
  ParsedQuestionRow,
} from './bulk-question-import-parser'

export type BulkQuestionImportDb = SupabaseClient<Database>

type CatalogRow = {
  id: string
  name: string
  slug?: string
  career_id?: string
}

export type BulkQuestionImportInput = {
  authorId: string
  adminUserId: string
  fileName: string
  fileSize: number
  totalRows?: number
  rows: ParsedQuestionRow[]
  parseErrors: BulkImportRowError[]
}

export type BulkQuestionImportSuccess = {
  ok: true
  author_id: string
  file_name: string
  total_rows: number
  imported: number
  failed: number
  created_question_ids: string[]
  errors: BulkImportRowError[]
}

export type BulkQuestionImportFailure = {
  ok: false
  code: 'not_found' | 'error'
  message: string
}

export type BulkQuestionImportResult =
  | BulkQuestionImportSuccess
  | BulkQuestionImportFailure

function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function findByName(rows: CatalogRow[], value: string): CatalogRow | null {
  const normalized = normalizeName(value)
  return (
    rows.find(
      (row) =>
        normalizeName(row.name) === normalized ||
        (row.slug ? normalizeName(row.slug) === normalized : false),
    ) ?? null
  )
}

async function loadCatalogs(db: BulkQuestionImportDb) {
  const [{ data: careers }, { data: subjects }, { data: boards }] =
    await Promise.all([
      db.from('careers').select('id, name, slug'),
      db.from('subjects').select('id, name, slug, career_id'),
      db.from('boards').select('id, name, slug'),
    ])

  return {
    careers: (careers ?? []) as CatalogRow[],
    subjects: (subjects ?? []) as CatalogRow[],
    boards: (boards ?? []) as CatalogRow[],
  }
}

function resolveRowCatalogs(
  row: ParsedQuestionRow,
  catalogs: Awaited<ReturnType<typeof loadCatalogs>>,
) {
  const career = findByName(catalogs.careers, row.careerName)
  if (!career) {
    return {
      ok: false as const,
      error: {
        line: row.line,
        field: 'career',
        message: 'Carreira nao encontrada.',
      },
    }
  }

  const subject =
    findByName(
      catalogs.subjects.filter((candidate) => candidate.career_id === career.id),
      row.subjectName,
    ) ?? null
  if (!subject) {
    return {
      ok: false as const,
      error: {
        line: row.line,
        field: 'subject',
        message: 'Disciplina nao encontrada para a carreira informada.',
      },
    }
  }

  const board = row.boardName ? findByName(catalogs.boards, row.boardName) : null
  if (row.boardName && !board) {
    return {
      ok: false as const,
      error: {
        line: row.line,
        field: 'board',
        message: 'Banca nao encontrada.',
      },
    }
  }

  return { ok: true as const, career, subject, board }
}

async function recordImportEvent(
  db: BulkQuestionImportDb,
  input: BulkQuestionImportInput,
  result: BulkQuestionImportSuccess,
) {
  await db.from('product_events').insert({
    user_id: input.adminUserId,
    event_name: 'admin_bulk_questions_imported',
    metadata: {
      author_id: input.authorId,
      file_name: input.fileName,
      file_size: input.fileSize,
      total_rows: result.total_rows,
      imported: result.imported,
      failed: result.failed,
    } satisfies Json,
  })
}

export async function importBulkQuestionsForAuthor(
  db: BulkQuestionImportDb,
  input: BulkQuestionImportInput,
): Promise<BulkQuestionImportResult> {
  const { data: author, error: authorError } = await db
    .from('author_profiles')
    .select('id')
    .eq('id', input.authorId)
    .maybeSingle()

  if (authorError) {
    return { ok: false, code: 'error', message: authorError.message }
  }
  if (!author) {
    return { ok: false, code: 'not_found', message: 'Autor nao encontrado.' }
  }

  const catalogs = await loadCatalogs(db)
  const errors = [...input.parseErrors]
  const createdQuestionIds: string[] = []

  for (const row of input.rows) {
    const resolved = resolveRowCatalogs(row, catalogs)
    if (!resolved.ok) {
      errors.push(resolved.error)
      continue
    }

    const { data: question, error: questionError } = await db
      .from('questions')
      .insert({
        author_id: input.authorId,
        career_id: resolved.career.id,
        subject_id: resolved.subject.id,
        board_id: resolved.board?.id ?? null,
        difficulty: row.difficulty,
        source_type: row.sourceType,
        source_orgao: row.sourceOrgao,
        source_cargo: row.sourceCargo,
        source_year: row.sourceYear,
        source_reference: row.sourceReference,
        statement: row.statement,
        general_comment: row.generalComment,
        status: 'draft',
      })
      .select('id')
      .single()

    if (questionError || !question) {
      errors.push({
        line: row.line,
        field: 'question',
        message: questionError?.message ?? 'Nao foi possivel criar a questao.',
      })
      continue
    }

    const questionId = question.id
    const { error: alternativesError } = await db.from('alternatives').insert(
      row.alternatives.map((alternative, index) => ({
        question_id: questionId,
        label: alternative.label,
        text: alternative.text,
        is_correct: row.correctLabel === alternative.label,
        alternative_comment: alternative.alternativeComment,
        position: index,
      })),
    )

    if (alternativesError) {
      errors.push({
        line: row.line,
        field: 'alternatives',
        message: alternativesError.message,
      })
      continue
    }

    createdQuestionIds.push(questionId)
  }

  const failedLines = new Set(errors.map((error) => error.line))
  const result: BulkQuestionImportSuccess = {
    ok: true,
    author_id: input.authorId,
    file_name: input.fileName,
    total_rows: input.totalRows ?? input.rows.length + failedLines.size,
    imported: createdQuestionIds.length,
    failed: failedLines.size,
    created_question_ids: createdQuestionIds,
    errors,
  }

  await recordImportEvent(db, input, result)
  return result
}
