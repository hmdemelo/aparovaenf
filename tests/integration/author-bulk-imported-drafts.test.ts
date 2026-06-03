import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/db/database.types'
import { loadLocalEnv } from './helpers/local-env'
import { getAuthorProfileId } from '@/features/authors/author-permissions'
import { listAuthorQuestions } from '@/features/authors/author-question-service'
import {
  importBulkQuestionsForAuthor,
  type BulkQuestionImportDb,
} from '@/features/admin/bulk-question-import-service'
import type { ParsedQuestionRow } from '@/features/admin/bulk-question-import-parser'

const hasLocal = loadLocalEnv()
const seedPassword = process.env.SEED_DEMO_PASSWORD
const d = hasLocal && seedPassword ? describe : describe.skip

async function signIn(email: string) {
  const client = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  )
  const { error } = await client.auth.signInWithPassword({
    email,
    password: seedPassword!,
  })
  if (error) throw new Error(`sign-in failed for ${email}: ${error.message}`)
  return client
}

function importedRow(): ParsedQuestionRow {
  return {
    line: 2,
    careerName: 'Enfermeiro(a)',
    subjectName: 'Saude Publica e SUS',
    boardName: null,
    difficulty: 'facil',
    sourceType: 'autoral',
    sourceOrgao: null,
    sourceCargo: null,
    sourceYear: null,
    sourceReference: null,
    statement: 'Questao importada para listagem do autor?',
    generalComment: 'Comentario geral importado.',
    correctLabel: 'A',
    alternatives: [
      { label: 'A', text: 'Alternativa A', alternativeComment: null },
      { label: 'B', text: 'Alternativa B', alternativeComment: null },
    ],
  }
}

d('bulk imported author drafts (local Supabase)', () => {
  let author: SupabaseClient<Database>
  let service: SupabaseClient<Database>
  let authorId: string
  const createdIds: string[] = []

  beforeAll(async () => {
    service = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    )
    author = await signIn('autor1@aprovaenf.local')
    const { data: user } = await author.auth.getUser()
    authorId = (await getAuthorProfileId(author, user.user!.id))!
  })

  afterAll(async () => {
    if (service && createdIds.length) {
      await service.from('questions').delete().in('id', createdIds)
    }
  })

  it('lists imported questions as author-owned drafts', async () => {
    const result = await importBulkQuestionsForAuthor(
      service as BulkQuestionImportDb,
      {
        authorId,
        adminUserId: '00000000-0000-0000-0000-0000000000a1',
        fileName: 'questoes.csv',
        fileSize: 256,
        totalRows: 1,
        rows: [importedRow()],
        parseErrors: [],
      },
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return
    createdIds.push(...result.created_question_ids)

    const questions = await listAuthorQuestions(author, authorId)
    const imported = questions.find((question) => question.id === result.created_question_ids[0])
    expect(imported).toBeTruthy()
    expect(imported!.status).toBe('draft')
  })
})
