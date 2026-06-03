import { describe, expect, it, vi } from 'vitest'
import {
  importBulkQuestionsForAuthor,
  type BulkQuestionImportDb,
} from '@/features/admin/bulk-question-import-service'
import type { ParsedQuestionRow } from '@/features/admin/bulk-question-import-parser'

const ADMIN_ID = '00000000-0000-0000-0000-0000000000ad'
const AUTHOR_ID = '00000000-0000-0000-0000-0000000000aa'
const CAREER_ID = '00000000-0000-0000-0000-0000000000c1'
const SUBJECT_ID = '00000000-0000-0000-0000-0000000000s1'
const BOARD_ID = '00000000-0000-0000-0000-0000000000b1'

function parsedRow(overrides: Partial<ParsedQuestionRow> = {}): ParsedQuestionRow {
  return {
    line: 2,
    careerName: 'Enfermagem',
    subjectName: 'SUS',
    boardName: 'IDIB',
    difficulty: 'media',
    sourceType: 'autoral',
    sourceOrgao: null,
    sourceCargo: null,
    sourceYear: null,
    sourceReference: null,
    statement: 'Questao importada?',
    generalComment: 'Comentario geral.',
    correctLabel: 'B',
    alternatives: [
      { label: 'A', text: 'Alternativa A', alternativeComment: null },
      { label: 'B', text: 'Alternativa B', alternativeComment: 'Boa resposta.' },
      { label: 'C', text: 'Alternativa C', alternativeComment: null },
    ],
    ...overrides,
  }
}

function createDb() {
  const tables = new Map<string, unknown[]>([
    [
      'author_profiles',
      [{ id: AUTHOR_ID, display_name: 'Profa. Maria' }],
    ],
    [
      'careers',
      [{ id: CAREER_ID, name: 'Enfermagem', slug: 'enfermagem' }],
    ],
    [
      'subjects',
      [{ id: SUBJECT_ID, name: 'SUS', career_id: CAREER_ID }],
    ],
    [
      'boards',
      [{ id: BOARD_ID, name: 'IDIB', slug: 'idib' }],
    ],
    ['questions', []],
    ['alternatives', []],
    ['product_events', []],
  ])
  const inserts: Record<string, unknown[]> = {}

  function from(table: string) {
    const state = {
      table,
      filters: [] as Array<[string, unknown]>,
      payload: undefined as unknown,
    }

    const builder = {
      select: vi.fn(() => builder),
      insert: vi.fn((payload: unknown) => {
        state.payload = payload
        const rows = Array.isArray(payload) ? payload : [payload]
        const created = rows.map((row, index) => ({
          id: `created-${table}-${(inserts[table]?.length ?? 0) + index + 1}`,
          ...(row as Record<string, unknown>),
        }))
        inserts[table] = [...(inserts[table] ?? []), ...created]
        return builder
      }),
      eq: vi.fn((column: string, value: unknown) => {
        state.filters.push([column, value])
        return builder
      }),
      maybeSingle: vi.fn(async () => {
        const rows = (tables.get(state.table) ?? []) as Record<string, unknown>[]
        const data =
          rows.find((row) =>
            state.filters.every(([column, value]) => row[column] === value),
          ) ?? null
        return { data, error: null }
      }),
      single: vi.fn(async () => {
        const rows = inserts[state.table] ?? []
        return { data: rows.at(-1) ?? null, error: null }
      }),
      then(resolve: (value: { data: unknown[]; error: null }) => void) {
        const rows = (tables.get(state.table) ?? []) as Record<string, unknown>[]
        resolve({ data: rows, error: null })
      },
    }
    return builder
  }

  return { db: { from } as unknown as BulkQuestionImportDb, inserts }
}

describe('importBulkQuestionsForAuthor', () => {
  it('creates draft questions and ordered alternatives for valid rows', async () => {
    const { db, inserts } = createDb()

    const result = await importBulkQuestionsForAuthor(db, {
      authorId: AUTHOR_ID,
      adminUserId: ADMIN_ID,
      fileName: 'questoes.csv',
      fileSize: 1234,
      rows: [parsedRow()],
      parseErrors: [],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.message)
    expect(result.imported).toBe(1)
    expect(result.failed).toBe(0)
    expect(inserts.questions).toHaveLength(1)
    expect(inserts.questions[0]).toMatchObject({
      author_id: AUTHOR_ID,
      career_id: CAREER_ID,
      subject_id: SUBJECT_ID,
      board_id: BOARD_ID,
      status: 'draft',
      difficulty: 'media',
      statement: 'Questao importada?',
    })
    expect(inserts.alternatives).toHaveLength(3)
    expect(inserts.alternatives[1]).toMatchObject({
      label: 'B',
      is_correct: true,
      position: 1,
      alternative_comment: 'Boa resposta.',
    })
  })

  it('reports unresolved catalog rows without blocking other rows', async () => {
    const { db, inserts } = createDb()

    const result = await importBulkQuestionsForAuthor(db, {
      authorId: AUTHOR_ID,
      adminUserId: ADMIN_ID,
      fileName: 'questoes.csv',
      fileSize: 1234,
      rows: [
        parsedRow(),
        parsedRow({ line: 3, subjectName: 'Inexistente' }),
      ],
      parseErrors: [],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.message)
    expect(result.imported).toBe(1)
    expect(result.failed).toBe(1)
    expect(result.errors).toEqual([
      {
        line: 3,
        field: 'subject',
        message: 'Disciplina nao encontrada para a carreira informada.',
      },
    ])
    expect(inserts.questions).toHaveLength(1)
  })

  it('returns not_found when the selected author does not exist', async () => {
    const { db } = createDb()

    const result = await importBulkQuestionsForAuthor(db, {
      authorId: '00000000-0000-0000-0000-000000000099',
      adminUserId: ADMIN_ID,
      fileName: 'questoes.csv',
      fileSize: 1234,
      rows: [parsedRow()],
      parseErrors: [],
    })

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('not_found')
  })

  it('records an audit product event for the import summary', async () => {
    const { db, inserts } = createDb()

    await importBulkQuestionsForAuthor(db, {
      authorId: AUTHOR_ID,
      adminUserId: ADMIN_ID,
      fileName: 'questoes.csv',
      fileSize: 1234,
      rows: [parsedRow()],
      parseErrors: [],
    })

    expect(inserts.product_events).toHaveLength(1)
    expect(inserts.product_events[0]).toMatchObject({
      user_id: ADMIN_ID,
      event_name: 'admin_bulk_questions_imported',
    })
  })
})
