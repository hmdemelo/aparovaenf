import Papa from 'papaparse'
import type { Difficulty, SourceType } from '@/lib/validation/schemas'

export const MAX_BULK_IMPORT_ROWS = 500
export const MAX_BULK_IMPORT_FILE_SIZE = 5 * 1024 * 1024

export type BulkImportRowError = {
  line: number
  field: string
  message: string
}

export type ParsedAlternativeRow = {
  label: string
  text: string
  alternativeComment: string | null
}

export type ParsedQuestionRow = {
  line: number
  careerName: string
  subjectName: string
  boardName: string | null
  difficulty: Difficulty
  sourceType: SourceType
  sourceOrgao: string | null
  sourceCargo: string | null
  sourceYear: number | null
  sourceReference: string | null
  statement: string
  generalComment: string | null
  correctLabel: string | null
  alternatives: ParsedAlternativeRow[]
}

export type BulkQuestionCsvParseResult = {
  rows: ParsedQuestionRow[]
  errors: BulkImportRowError[]
  globalErrors: string[]
  totalRows: number
}

type RawQuestionRow = Record<string, string | undefined>

const HEADER_ALIASES: Record<string, string> = {
  carreira: 'career',
  career: 'career',
  subject: 'subject',
  materia: 'subject',
  disciplina: 'subject',
  difficulty: 'difficulty',
  dificuldade: 'difficulty',
  statement: 'statement',
  stem: 'statement',
  enunciado: 'statement',
  alta: 'alt_a',
  alternativaa: 'alt_a',
  a: 'alt_a',
  altb: 'alt_b',
  alternativab: 'alt_b',
  b: 'alt_b',
  altc: 'alt_c',
  alternativac: 'alt_c',
  c: 'alt_c',
  altd: 'alt_d',
  alternativad: 'alt_d',
  d: 'alt_d',
  alte: 'alt_e',
  alternativae: 'alt_e',
  e: 'alt_e',
  correct: 'correct',
  correta: 'correct',
  respostacorreta: 'correct',
  gabarito: 'correct',
  commentary: 'general_comment',
  comentario: 'general_comment',
  comentariogeral: 'general_comment',
  generalcomment: 'general_comment',
  source: 'source_reference',
  fonte: 'source_reference',
  origem: 'source_reference',
  sourcereference: 'source_reference',
  sourceyear: 'source_year',
  year: 'source_year',
  ano: 'source_year',
  sourcetype: 'source_type',
  tipoorigem: 'source_type',
  board: 'board',
  banca: 'board',
  sourceorgao: 'source_orgao',
  orgao: 'source_orgao',
  sourcecargo: 'source_cargo',
  cargo: 'source_cargo',
  commenta: 'comment_a',
  comentarioa: 'comment_a',
  commentb: 'comment_b',
  comentariob: 'comment_b',
  commentc: 'comment_c',
  comentarioc: 'comment_c',
  commentd: 'comment_d',
  comentariod: 'comment_d',
  commente: 'comment_e',
  comentarioe: 'comment_e',
}

const ALTERNATIVE_LABELS = ['A', 'B', 'C', 'D', 'E'] as const

export function normalizeCsvHeader(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function canonicalHeader(value: string): string {
  const normalized = normalizeCsvHeader(value)
  return HEADER_ALIASES[normalized] ?? normalized
}

function cell(row: RawQuestionRow, field: string): string {
  return String(row[field] ?? '').trim()
}

function normalizeDifficulty(value: string): Difficulty | null {
  const normalized = normalizeCsvHeader(value)
  if (normalized === 'facil') return 'facil'
  if (normalized === 'media') return 'media'
  if (normalized === 'dificil') return 'dificil'
  return null
}

function normalizeSourceType(value: string): SourceType | null {
  if (!value.trim()) return 'autoral'
  const normalized = normalizeCsvHeader(value)
  if (normalized === 'autoral') return 'autoral'
  if (normalized === 'provaoficial') return 'prova_oficial'
  return null
}

function parseYear(value: string): number | null | 'invalid' {
  if (!value) return null
  if (!/^\d+$/.test(value)) return 'invalid'
  const year = Number(value)
  if (year < 1900 || year > 2100) return 'invalid'
  return year
}

function parseRow(row: RawQuestionRow, index: number) {
  const line = index + 2
  const errors: BulkImportRowError[] = []

  const statement = cell(row, 'statement')
  const careerName = cell(row, 'career')
  const subjectName = cell(row, 'subject')
  const difficulty = normalizeDifficulty(cell(row, 'difficulty'))
  const sourceType = normalizeSourceType(cell(row, 'source_type'))
  const sourceYear = parseYear(cell(row, 'source_year'))
  const correctLabel = cell(row, 'correct').toUpperCase()

  if (!statement) {
    errors.push({ line, field: 'statement', message: 'Enunciado e obrigatorio.' })
  }
  if (!careerName) {
    errors.push({ line, field: 'career', message: 'Carreira e obrigatoria.' })
  }
  if (!subjectName) {
    errors.push({ line, field: 'subject', message: 'Disciplina e obrigatoria.' })
  }
  if (!difficulty) {
    errors.push({
      line,
      field: 'difficulty',
      message: 'Dificuldade deve ser facil, media ou dificil.',
    })
  }
  if (sourceYear === 'invalid') {
    errors.push({
      line,
      field: 'source_year',
      message: 'Ano deve ser um inteiro entre 1900 e 2100.',
    })
  }
  if (!sourceType) {
    errors.push({
      line,
      field: 'source_type',
      message: 'Tipo de origem deve ser autoral ou prova_oficial.',
    })
  }

  const alternatives = ALTERNATIVE_LABELS.flatMap((label) => {
    const suffix = label.toLowerCase()
    const text = cell(row, `alt_${suffix}`)
    if (!text) return []
    return {
      label,
      text,
      alternativeComment: cell(row, `comment_${suffix}`) || null,
    }
  })

  if (alternatives.length < 2) {
    errors.push({
      line,
      field: 'alternatives',
      message: 'Informe pelo menos duas alternativas.',
    })
  }

  if (correctLabel) {
    const validCorrect = ALTERNATIVE_LABELS.includes(
      correctLabel as (typeof ALTERNATIVE_LABELS)[number],
    )
    const hasAlternative = alternatives.some((alt) => alt.label === correctLabel)
    if (!validCorrect || !hasAlternative) {
      errors.push({
        line,
        field: 'correct',
        message: 'Gabarito deve apontar para uma alternativa preenchida de A a E.',
      })
    }
  }

  if (errors.length > 0 || !difficulty || !sourceType || sourceYear === 'invalid') {
    return { row: null, errors }
  }

  const parsed: ParsedQuestionRow = {
    line,
    careerName,
    subjectName,
    boardName: cell(row, 'board') || null,
    difficulty,
    sourceType,
    sourceOrgao: cell(row, 'source_orgao') || null,
    sourceCargo: cell(row, 'source_cargo') || null,
    sourceYear,
    sourceReference: cell(row, 'source_reference') || null,
    statement,
    generalComment: cell(row, 'general_comment') || null,
    correctLabel: correctLabel || null,
    alternatives,
  }
  return { row: parsed, errors }
}

export function parseBulkQuestionCsv(text: string): BulkQuestionCsvParseResult {
  const parsed = Papa.parse<RawQuestionRow>(text, {
    delimiter: ';',
    header: true,
    skipEmptyLines: true,
    transformHeader: canonicalHeader,
  })

  const totalRows = parsed.data.length
  const globalErrors = parsed.errors.map(
    (error) => `Linha ${error.row ?? '?'}: ${error.message}`,
  )
  if (totalRows === 0) {
    globalErrors.push('O CSV deve conter pelo menos uma linha de dados.')
  }
  if (totalRows > MAX_BULK_IMPORT_ROWS) {
    globalErrors.push('O CSV deve ter no máximo 500 linhas de dados.')
  }
  if (globalErrors.length > 0) {
    return { rows: [], errors: [], globalErrors, totalRows }
  }

  const rows: ParsedQuestionRow[] = []
  const errors: BulkImportRowError[] = []

  parsed.data.forEach((rawRow, index) => {
    const result = parseRow(rawRow, index)
    errors.push(...result.errors)
    if (result.row) rows.push(result.row)
  })

  return { rows, errors, globalErrors, totalRows }
}
