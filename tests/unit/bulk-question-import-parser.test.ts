import { describe, expect, it } from 'vitest'
import {
  parseBulkQuestionCsv,
  normalizeCsvHeader,
} from '@/features/admin/bulk-question-import-parser'

function validCsv(overrides = '') {
  return [
    'carreira;disciplina;dificuldade;enunciado;alternativa a;alternativa b;alternativa c;gabarito;comentario;ano;fonte',
    `"Enfermagem";"SUS";"facil";"Qual principio do SUS garante acesso a todos?";"Universalidade";"Integralidade";"Equidade";"A";"Comentario geral";"2024";"Banca 2024"`,
    overrides,
  ]
    .filter(Boolean)
    .join('\n')
}

describe('normalizeCsvHeader', () => {
  it('normalizes accents, punctuation, casing, spaces, and underscores', () => {
    expect(normalizeCsvHeader(' Alt. A ')).toBe('alta')
    expect(normalizeCsvHeader('Comentário Geral')).toBe('comentariogeral')
    expect(normalizeCsvHeader('source_reference')).toBe('sourcereference')
  })
})

describe('parseBulkQuestionCsv', () => {
  it('accepts aliases from the existing bulk import document', () => {
    const result = parseBulkQuestionCsv(validCsv())

    expect(result.globalErrors).toEqual([])
    expect(result.rows).toHaveLength(1)
    expect(result.errors).toEqual([])
    expect(result.rows[0]).toMatchObject({
      line: 2,
      careerName: 'Enfermagem',
      subjectName: 'SUS',
      difficulty: 'facil',
      statement: 'Qual principio do SUS garante acesso a todos?',
      correctLabel: 'A',
      generalComment: 'Comentario geral',
      sourceYear: 2024,
      sourceReference: 'Banca 2024',
    })
    expect(result.rows[0].alternatives).toEqual([
      { label: 'A', text: 'Universalidade', alternativeComment: null },
      { label: 'B', text: 'Integralidade', alternativeComment: null },
      { label: 'C', text: 'Equidade', alternativeComment: null },
    ])
  })

  it('supports quoted semicolon fields without splitting the statement', () => {
    const result = parseBulkQuestionCsv(
      [
        'career;subject;difficulty;statement;alt_a;alt_b',
        'Enfermagem;SUS;media;"Texto com; ponto e virgula";A;B',
      ].join('\n'),
    )

    expect(result.errors).toEqual([])
    expect(result.rows[0].statement).toBe('Texto com; ponto e virgula')
  })

  it('reports row-level errors and keeps valid rows', () => {
    const result = parseBulkQuestionCsv(
      validCsv(
        '"Enfermagem";"";"media";"";"A";"";"";"C";"";"";""',
      ),
    )

    expect(result.rows).toHaveLength(1)
    expect(result.errors.map((error) => error.line)).toEqual([3, 3, 3, 3])
    expect(result.errors.map((error) => error.field)).toEqual([
      'statement',
      'subject',
      'alternatives',
      'correct',
    ])
  })

  it('rejects more than 500 data rows before returning valid rows', () => {
    const rows = Array.from(
      { length: 501 },
      (_, index) =>
        `Enfermagem;SUS;facil;"Questao ${index}";A;B;C`,
    )
    const result = parseBulkQuestionCsv(
      ['career;subject;difficulty;statement;alt_a;alt_b;alt_c', ...rows].join(
        '\n',
      ),
    )

    expect(result.rows).toEqual([])
    expect(result.errors).toEqual([])
    expect(result.globalErrors).toContain(
      'O CSV deve ter no máximo 500 linhas de dados.',
    )
  })

  it('rejects invalid years and unsupported source types', () => {
    const result = parseBulkQuestionCsv(
      [
        'career;subject;difficulty;statement;alt_a;alt_b;source_year;source_type',
        'Enfermagem;SUS;facil;"Questao";A;B;1800;externa',
      ].join('\n'),
    )

    expect(result.errors.map((error) => error.field)).toEqual([
      'source_year',
      'source_type',
    ])
  })
})
