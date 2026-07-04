#!/usr/bin/env npx tsx
/**
 * Exporta todas as questões publicadas em CSV para análise.
 * Uso: npx tsx scripts/export-questions.ts
 * Saída: output/questions-export.csv
 */

import { createClient } from '@supabase/supabase-js'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nas variáveis de ambiente.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
})

function escapeCsv(value: string | null | undefined): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

function row(fields: (string | null | undefined)[]): string {
  return fields.map(escapeCsv).join(',')
}

async function main() {
  console.log('Buscando questões publicadas...')

  const { data: questions, error } = await supabase
    .from('questions')
    .select(`
      id,
      status,
      difficulty,
      source_type,
      source_orgao,
      source_cargo,
      source_year,
      source_reference,
      statement,
      general_comment,
      annulled,
      answer_key_changed,
      created_at,
      published_at,
      careers ( name ),
      boards ( name ),
      subjects ( name ),
      author_profiles ( display_name ),
      alternatives (
        label,
        text,
        is_correct,
        alternative_comment,
        position
      )
    `)
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar questões:', error.message)
    process.exit(1)
  }

  console.log(`${questions?.length ?? 0} questões encontradas.`)

  const headers = [
    'id',
    'carreira',
    'banca',
    'assunto',
    'autor',
    'dificuldade',
    'tipo',
    'orgao',
    'cargo',
    'ano',
    'referencia',
    'anulada',
    'gabarito_alterado',
    'publicada_em',
    'criada_em',
    'enunciado',
    'comentario_geral',
    'alt_a_texto',
    'alt_a_correta',
    'alt_a_comentario',
    'alt_b_texto',
    'alt_b_correta',
    'alt_b_comentario',
    'alt_c_texto',
    'alt_c_correta',
    'alt_c_comentario',
    'alt_d_texto',
    'alt_d_correta',
    'alt_d_comentario',
    'alt_e_texto',
    'alt_e_correta',
    'alt_e_comentario',
  ]

  const lines: string[] = [headers.join(',')]

  for (const q of questions ?? []) {
    const alts = [...(q.alternatives ?? [])].sort((a, b) => a.position - b.position)
    const altByLabel: Record<string, typeof alts[0]> = {}
    for (const a of alts) {
      altByLabel[a.label.toUpperCase()] = a
    }

    const career = Array.isArray(q.careers) ? q.careers[0]?.name : (q.careers as { name?: string } | null)?.name
    const board = Array.isArray(q.boards) ? q.boards[0]?.name : (q.boards as { name?: string } | null)?.name
    const subject = Array.isArray(q.subjects) ? q.subjects[0]?.name : (q.subjects as { name?: string } | null)?.name
    const author = Array.isArray(q.author_profiles) ? q.author_profiles[0]?.display_name : (q.author_profiles as { display_name?: string } | null)?.display_name

    const altFields = (label: string) => {
      const a = altByLabel[label]
      if (!a) return ['', '', '']
      return [a.text, a.is_correct ? 'sim' : 'nao', a.alternative_comment ?? '']
    }

    lines.push(row([
      q.id,
      career,
      board,
      subject,
      author,
      q.difficulty,
      q.source_type,
      q.source_orgao,
      q.source_cargo,
      q.source_year ? String(q.source_year) : '',
      q.source_reference,
      q.annulled ? 'sim' : 'nao',
      q.answer_key_changed ? 'sim' : 'nao',
      q.published_at,
      q.created_at,
      q.statement,
      q.general_comment,
      ...altFields('A'),
      ...altFields('B'),
      ...altFields('C'),
      ...altFields('D'),
      ...altFields('E'),
    ]))
  }

  mkdirSync(join(process.cwd(), 'output'), { recursive: true })
  const outputPath = join(process.cwd(), 'output', 'questions-export.csv')
  writeFileSync(outputPath, lines.join('\n'), 'utf-8')

  console.log(`Exportado: ${outputPath}`)
  console.log(`Total: ${lines.length - 1} questões`)
}

main()
