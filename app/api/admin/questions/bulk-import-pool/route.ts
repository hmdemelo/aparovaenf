import type { NextRequest } from 'next/server'
import { adminAuthFail } from '@/lib/api/admin-guard'
import { ErrorCodes, fail, ok } from '@/lib/api/response'
import { createSupabaseServiceClient } from '@/lib/db/server'
import { resolveAdminContext } from '@/features/admin/admin-permissions'
import {
  MAX_BULK_IMPORT_FILE_SIZE,
  parseBulkQuestionCsv,
} from '@/features/admin/bulk-question-import-parser'
import { importBulkQuestionsForAuthor } from '@/features/admin/bulk-question-import-service'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

type UploadedCsvFile = {
  name?: string
  type?: string
  size: number
  text: () => Promise<string>
}

function isUploadedFile(value: unknown): value is UploadedCsvFile {
  return (
    typeof value === 'object' &&
    value !== null &&
    'size' in value &&
    'text' in value &&
    typeof value.text === 'function'
  )
}

function isCsvFile(file: UploadedCsvFile): boolean {
  const name = (file.name ?? '').toLowerCase()
  return name.endsWith('.csv') || file.type === 'text/csv'
}

export async function POST(request: NextRequest) {
  const ctx = await resolveAdminContext()
  if (!ctx.ok) return adminAuthFail(ctx.code)

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return fail(ErrorCodes.VALIDATION, 'Envie o arquivo CSV em multipart/form-data.')
  }

  const file = formData.get('file')
  if (!isUploadedFile(file)) {
    return fail(ErrorCodes.VALIDATION, 'Arquivo CSV é obrigatório.')
  }
  if (!isCsvFile(file)) {
    return fail(ErrorCodes.VALIDATION, 'Envie um arquivo CSV.')
  }
  if (file.size > MAX_BULK_IMPORT_FILE_SIZE) {
    return fail(ErrorCodes.VALIDATION, 'O arquivo deve ter no máximo 5 MB.')
  }

  const text = await file.text()
  const parsed = parseBulkQuestionCsv(text)
  if (parsed.globalErrors.length > 0) {
    return fail(ErrorCodes.VALIDATION, parsed.globalErrors.join(' '))
  }

  const serviceDb = createSupabaseServiceClient()
  const result = await importBulkQuestionsForAuthor(serviceDb, {
    authorId: 'pool',
    adminUserId: ctx.userId,
    fileName: file.name ?? 'questoes_pool.csv',
    fileSize: file.size,
    totalRows: parsed.totalRows,
    rows: parsed.rows,
    parseErrors: parsed.errors,
    parseWarnings: parsed.warnings,
  })

  if (!result.ok) {
    return fail(ErrorCodes.INTERNAL, result.message)
  }

  return ok({
    author_id: result.author_id,
    file_name: result.file_name,
    total_rows: result.total_rows,
    imported: result.imported,
    failed: result.failed,
    created_question_ids: result.created_question_ids,
    errors: result.errors,
    warnings: result.warnings,
  })
}
