import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/db/database.types'
import { loadLocalEnv } from './helpers/local-env'
import {
  createDraftQuestion,
  publishQuestion,
  updateQuestion,
  getAuthorQuestion,
} from '@/features/authors/author-question-service'
import { getAuthorProfileId } from '@/features/authors/author-permissions'
import {
  importBulkQuestionsForAuthor,
  type BulkQuestionImportDb,
} from '@/features/admin/bulk-question-import-service'
import type { ParsedQuestionRow } from '@/features/admin/bulk-question-import-parser'

const hasLocal = loadLocalEnv()
// Demo password for the seeded users lives only in .env.local (gitignored).
const seedPassword = process.env.SEED_DEMO_PASSWORD
const d = hasLocal && seedPassword ? describe : describe.skip

const CAREER_ENFERMAGEM = '00000000-0000-0000-0000-0000000000c1'

async function signedInClient(email: string) {
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

d('author question pipeline (local Supabase)', () => {
  let author1: SupabaseClient<Database>
  let author2: SupabaseClient<Database>
  let service: SupabaseClient<Database>
  let authorId1: string
  let authorId2: string
  let subjectId: string
  const createdIds: string[] = []

  beforeAll(async () => {
    service = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    )
    author1 = await signedInClient('autor1@aprovaenf.local')
    author2 = await signedInClient('autor2@aprovaenf.local')

    const { data: u1 } = await author1.auth.getUser()
    const { data: u2 } = await author2.auth.getUser()
    authorId1 = (await getAuthorProfileId(author1, u1.user!.id))!
    authorId2 = (await getAuthorProfileId(author2, u2.user!.id))!

    const { data: subject } = await service
      .from('subjects')
      .select('id')
      .eq('career_id', CAREER_ENFERMAGEM)
      .limit(1)
      .single()
    subjectId = subject!.id
  })

  afterAll(async () => {
    if (service && createdIds.length) {
      await service.from('questions').delete().in('id', createdIds)
    }
  })

  function draftInput() {
    return {
      career_id: CAREER_ENFERMAGEM,
      subject_id: subjectId,
      difficulty: 'media' as const,
      source_type: 'autoral' as const,
      statement: 'Questão de teste de integração do autor?',
      alternatives: [
        { label: 'A', text: 'Alternativa A', is_correct: false },
        { label: 'B', text: 'Alternativa B', is_correct: true },
      ],
    }
  }

  function importedIncompleteRow(): ParsedQuestionRow {
    return {
      line: 2,
      careerName: 'Enfermeiro(a)',
      subjectName: 'Fundamentos de Enfermagem',
      boardName: null,
      difficulty: 'facil',
      sourceType: 'autoral',
      sourceOrgao: null,
      sourceCargo: null,
      sourceYear: null,
      sourceReference: null,
      statement: 'Questão importada incompleta para publicação?',
      generalComment: null,
      correctLabel: null,
      alternatives: [
        { label: 'A', text: 'Alternativa A', alternativeComment: null },
        { label: 'B', text: 'Alternativa B', alternativeComment: null },
      ],
    }
  }

  it('creates a draft owned by the author', async () => {
    const result = await createDraftQuestion(author1, authorId1, draftInput())
    expect(result.ok).toBe(true)
    if (result.ok) {
      createdIds.push(result.data.id)
      const { data } = await service
        .from('questions')
        .select('status, author_id')
        .eq('id', result.data.id)
        .single()
      expect(data!.status).toBe('draft')
      expect(data!.author_id).toBe(authorId1)
    }
  })

  it('blocks publishing without a general comment, then succeeds once added', async () => {
    const created = await createDraftQuestion(author1, authorId1, draftInput())
    expect(created.ok).toBe(true)
    if (!created.ok) return
    createdIds.push(created.data.id)

    // No general comment yet -> publish must fail with a clear reason.
    const blocked = await publishQuestion(author1, authorId1, created.data.id)
    expect(blocked.ok).toBe(false)
    if (!blocked.ok) {
      expect(blocked.code).toBe('validation')
      expect(blocked.errors).toContain('general comment is required to publish')
    }

    // Add the comment, then publish succeeds.
    const updated = await updateQuestion(author1, authorId1, created.data.id, {
      ...draftInput(),
      general_comment: 'Explicação geral da questão.',
    })
    expect(updated.ok).toBe(true)

    const published = await publishQuestion(author1, authorId1, created.data.id)
    expect(published.ok).toBe(true)

    const { data } = await service
      .from('questions')
      .select('status, published_at')
      .eq('id', created.data.id)
      .single()
    expect(data!.status).toBe('published')
    expect(data!.published_at).not.toBeNull()
  })

  it('prevents an author from publishing another author’s question', async () => {
    const created = await createDraftQuestion(author1, authorId1, {
      ...draftInput(),
      general_comment: 'Comentário.',
    })
    expect(created.ok).toBe(true)
    if (!created.ok) return
    createdIds.push(created.data.id)

    const forbidden = await publishQuestion(author2, authorId2, created.data.id)
    expect(forbidden.ok).toBe(false)
    if (!forbidden.ok) expect(forbidden.code).toBe('forbidden')
  })

  it('keeps incomplete imported drafts blocked by publish validation', async () => {
    const imported = await importBulkQuestionsForAuthor(
      service as BulkQuestionImportDb,
      {
        authorId: authorId1,
        adminUserId: '00000000-0000-0000-0000-0000000000a1',
        fileName: 'questoes.csv',
        fileSize: 256,
        totalRows: 1,
        rows: [importedIncompleteRow()],
        parseErrors: [],
      },
    )

    expect(imported.ok).toBe(true)
    if (!imported.ok) return
    createdIds.push(...imported.created_question_ids)

    const blocked = await publishQuestion(
      author1,
      authorId1,
      imported.created_question_ids[0],
    )
    expect(blocked.ok).toBe(false)
    if (!blocked.ok) {
      expect(blocked.code).toBe('validation')
      expect(blocked.errors).toContain('general comment is required to publish')
      expect(blocked.errors).toContain('exactly one correct alternative is required')
    }
  })

  it('creates, updates and retrieves question tags correctly', async () => {
    const result = await createDraftQuestion(author1, authorId1, {
      ...draftInput(),
      tags: ['biosseguranca', 'pni-2026'],
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    createdIds.push(result.data.id)

    // Assert tags were linked
    const { data: qTags } = await service
      .from('question_tags')
      .select('tag:tags(name)')
      .eq('question_id', result.data.id)
    const tagNames = (qTags ?? []).map((t) => (t.tag as { name: string }).name)
    expect(tagNames).toContain('biosseguranca')
    expect(tagNames).toContain('pni-2026')

    // Update tags (one removed, one added)
    const updated = await updateQuestion(author1, authorId1, result.data.id, {
      ...draftInput(),
      tags: ['pni-2026', 'vacina-covid'],
    })
    expect(updated.ok).toBe(true)

    // Assert updated tags
    const { data: qTags2 } = await service
      .from('question_tags')
      .select('tag:tags(name)')
      .eq('question_id', result.data.id)
    const tagNames2 = (qTags2 ?? []).map((t) => (t.tag as { name: string }).name)
    expect(tagNames2).not.toContain('biosseguranca')
    expect(tagNames2).toContain('pni-2026')
    expect(tagNames2).toContain('vacina-covid')

    // Retrieve via service
    const question = await getAuthorQuestion(author1, authorId1, result.data.id)
    expect(question).not.toBeNull()
    const retrievedTags = (question?.tags ?? []).map((t) => (t as { name: string }).name)
    expect(retrievedTags).toContain('pni-2026')
    expect(retrievedTags).toContain('vacina-covid')
  })
})
