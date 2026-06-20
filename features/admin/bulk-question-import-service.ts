import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/db/database.types'
import { safeUUID } from '@/lib/utils/uuid'
import type {
  BulkImportRowError,
  BulkImportRowWarning,
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
  parseWarnings?: BulkImportRowWarning[]
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
  warnings: BulkImportRowWarning[]
}

export type BulkQuestionImportFailure = {
  ok: false
  code: 'not_found' | 'schema_outdated' | 'error'
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

function isOutdatedClassificationSchema(error: {
  code?: string
  message?: string
}): boolean {
  if (error.code !== '23502') return false
  return ['career_id', 'subject_id', 'difficulty'].some((column) =>
    error.message?.includes(`"${column}"`),
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
  const warnings: BulkImportRowWarning[] = []
  const career = row.careerName
    ? findByName(catalogs.careers, row.careerName)
    : null

  if (row.careerName && !career) {
    warnings.push({
      line: row.line,
      field: 'career',
      message:
        'Carreira ou especialidade não encontrada; o autor deverá preenchê-la na plataforma.',
    })
  }

  let subject: CatalogRow | null = null
  if (row.subjectName && career) {
    subject = findByName(
      catalogs.subjects.filter((candidate) => candidate.career_id === career.id),
      row.subjectName,
    )
    if (!subject) {
      warnings.push({
        line: row.line,
        field: 'subject',
        message:
          'Disciplina não encontrada para a carreira informada; o autor deverá preenchê-la na plataforma.',
      })
    }
  } else if (row.subjectName) {
    warnings.push({
      line: row.line,
      field: 'subject',
      message:
        'Disciplina não associada porque a carreira está vazia ou não foi reconhecida.',
    })
  }

  const board = row.boardName ? findByName(catalogs.boards, row.boardName) : null
  if (row.boardName && !board) {
    warnings.push({
      line: row.line,
      field: 'board',
      message: 'Banca não encontrada; o autor deverá preenchê-la na plataforma.',
    })
  }

  return { career, subject, board, warnings }
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
      warnings: result.warnings.length,
    } satisfies Json,
  })
}

export async function importBulkQuestionsForAuthor(
  db: BulkQuestionImportDb,
  input: BulkQuestionImportInput,
): Promise<BulkQuestionImportResult> {
  const isPool = input.authorId === 'pool'
  if (!isPool) {
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
  }

  const catalogs = await loadCatalogs(db)
  const errors = [...input.parseErrors]
  const warnings = [...(input.parseWarnings ?? [])]
  const createdQuestionIds: string[] = []
  const parsedFailedLines = new Set(input.parseErrors.map((error) => error.line))

  const questionsToInsert: Database['public']['Tables']['questions']['Insert'][] = []
  const alternativesToInsert: Database['public']['Tables']['alternatives']['Insert'][] = []
  const rowToQuestionIdMap = new Map<number, string>()

  for (const row of input.rows) {
    const resolved = resolveRowCatalogs(row, catalogs)
    warnings.push(...resolved.warnings)

    const questionId = safeUUID()
    rowToQuestionIdMap.set(row.line, questionId)

    questionsToInsert.push({
      id: questionId,
      author_id: isPool ? null : input.authorId,
      career_id: resolved.career?.id ?? null,
      subject_id: resolved.subject?.id ?? null,
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

    row.alternatives.forEach((alternative, index) => {
      alternativesToInsert.push({
        question_id: questionId,
        label: alternative.label,
        text: alternative.text,
        is_correct: row.correctLabel === alternative.label,
        alternative_comment: alternative.alternativeComment,
        position: index,
      })
    })
  }

  if (questionsToInsert.length > 0) {
    const { error: questionError } = await db
      .from('questions')
      .insert(questionsToInsert)
      .select('id')

    if (questionError) {
      if (isOutdatedClassificationSchema(questionError)) {
        console.error('Bulk import blocked by outdated questions schema', {
          code: questionError.code,
          authorId: input.authorId,
        })
        return {
          ok: false,
          code: 'schema_outdated',
          message:
            'O banco de dados ainda não está preparado para importar rascunhos sem classificação.',
        }
      }

      console.error('Failed to batch insert questions', {
        code: questionError.code,
        message: questionError.message,
        authorId: input.authorId,
      })

      for (const row of input.rows) {
        errors.push({
          line: row.line,
          field: 'question',
          message: 'Não foi possível criar a questão (erro no lote).',
        })
      }
    } else {
      if (alternativesToInsert.length > 0) {
        const { error: alternativesError } = await db
          .from('alternatives')
          .insert(alternativesToInsert)

        if (alternativesError) {
          console.error('Failed to batch insert alternatives', {
            code: alternativesError.code,
            message: alternativesError.message,
            authorId: input.authorId,
          })

          const insertedIds = Array.from(rowToQuestionIdMap.values())
          if (insertedIds.length > 0) {
            await db.from('questions').delete().in('id', insertedIds)
          }

          for (const row of input.rows) {
            errors.push({
              line: row.line,
              field: 'alternatives',
              message: 'Não foi possível salvar as alternativas da questão (erro no lote).',
            })
          }
        } else {
          createdQuestionIds.push(...Array.from(rowToQuestionIdMap.values()))
        }
      } else {
        createdQuestionIds.push(...Array.from(rowToQuestionIdMap.values()))
      }
    }
  }

  const failedLines = new Set(errors.map((error) => error.line))
  const result: BulkQuestionImportSuccess = {
    ok: true,
    author_id: input.authorId,
    file_name: input.fileName,
    total_rows: input.totalRows ?? input.rows.length + parsedFailedLines.size,
    imported: createdQuestionIds.length,
    failed: failedLines.size,
    created_question_ids: createdQuestionIds,
    errors,
    warnings,
  }

  await recordImportEvent(db, input, result)
  return result
}
