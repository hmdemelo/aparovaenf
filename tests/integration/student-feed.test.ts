import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/db/database.types'
import { loadLocalEnv } from './helpers/local-env'
import {
  getNextQuestion,
  gradeAnswer,
  recordAnswerAttempt,
  countAnswersBySession,
  getAnsweredQuestionIdsBySession,
} from '@/features/questions/question-repository'

const hasLocal = loadLocalEnv()
const d = hasLocal ? describe : describe.skip

// A throwaway anonymous session id, cleaned up afterwards.
const SESSION_ID = '00000000-0000-0000-0000-00000000e2e1'
// Seed question used by the grading tests; lives in career "enfermeiro-a".
const Q_F1 = '00000000-0000-0000-0000-0000000000f1'
// Throwaway tag for the feed-filtering tests, cleaned up afterwards.
const FILTER_TAG_SLUG = 'feed-filter-tag-e2e'

let db: SupabaseClient<Database>

d('student feed integration (local Supabase)', () => {
  beforeAll(() => {
    db = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    )
  })

  afterAll(async () => {
    if (db) {
      await db.from('answer_attempts').delete().eq('anonymous_session_id', SESSION_ID)
      await db.from('tags').delete().eq('slug', FILTER_TAG_SLUG)
    }
  })

  it('filters the feed by a dynamic tag', async () => {
    const { data: question } = await db
      .from('questions')
      .select('subject_id')
      .eq('id', Q_F1)
      .single()
    await db.from('tags').delete().eq('slug', FILTER_TAG_SLUG)

    // Create a topic in f1's discipline and link it only to f1.
    const { data: tag, error: tagError } = await db
      .from('tags')
      .insert({
        name: 'Filtro Feed E2E',
        slug: FILTER_TAG_SLUG,
        subject_id: question!.subject_id,
      })
      .select('id')
      .single()
    expect(tagError).toBeNull()
    expect(tag).not.toBeNull()
    await db
      .from('question_tags')
      .upsert({ question_id: Q_F1, tag_id: tag!.id })

    // Filtering by the tag returns f1 (the only tagged question).
    const tagged = await getNextQuestion(db, {
      careerSlug: 'enfermeiro-a',
      tagIds: [tag!.id],
    })
    expect(tagged!.id).toBe(Q_F1)

    // Excluding f1 leaves no question carrying the tag.
    const none = await getNextQuestion(db, {
      careerSlug: 'enfermeiro-a',
      tagIds: [tag!.id],
      excludeIds: [Q_F1],
    })
    expect(none).toBeNull()
  })

  it('filters the feed by subject and returns null for an unrelated subject', async () => {
    const { data: row } = await db
      .from('questions')
      .select('subject_id')
      .eq('id', Q_F1)
      .single()

    const match = await getNextQuestion(db, {
      careerSlug: 'enfermeiro-a',
      subjectId: row!.subject_id!,
    })
    expect(match).not.toBeNull()

    const unrelated = await getNextQuestion(db, {
      careerSlug: 'enfermeiro-a',
      subjectId: '00000000-0000-0000-0000-0000000000ff',
    })
    expect(unrelated).toBeNull()
  })

  it('returns a published question with alternatives and no correctness flag', async () => {
    const question = await getNextQuestion(db, { careerSlug: 'enfermeiro-a' })
    expect(question).not.toBeNull()
    expect(question!.alternatives.length).toBeGreaterThanOrEqual(2)
    // Feed payload must not leak which alternative is correct.
    for (const alt of question!.alternatives) {
      expect(alt).not.toHaveProperty('is_correct')
    }
    // Alternatives are ordered by position.
    const positions = question!.alternatives.map((a) => a.position)
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
  })

  it('excludes already-answered questions from the feed', async () => {
    const first = await getNextQuestion(db, { careerSlug: 'enfermeiro-a' })
    const next = await getNextQuestion(db, {
      careerSlug: 'enfermeiro-a',
      excludeIds: [first!.id],
    })
    expect(next!.id).not.toBe(first!.id)
  })

  it('grades a known correct answer for the hand-washing question', async () => {
    // f1: alternative "B" is correct (see seed.sql).
    const q = await db
      .from('alternatives')
      .select('id, label')
      .eq('question_id', '00000000-0000-0000-0000-0000000000f1')
    const correctB = q.data!.find((a) => a.label === 'B')!
    const wrongA = q.data!.find((a) => a.label === 'A')!

    const right = await gradeAnswer(db, {
      questionId: '00000000-0000-0000-0000-0000000000f1',
      selectedAlternativeId: correctB.id,
    })
    expect(right!.isCorrect).toBe(true)
    expect(right!.correctAlternativeId).toBe(correctB.id)
    expect(right!.generalComment).toBeTruthy()

    const wrong = await gradeAnswer(db, {
      questionId: '00000000-0000-0000-0000-0000000000f1',
      selectedAlternativeId: wrongA.id,
    })
    expect(wrong!.isCorrect).toBe(false)
    expect(wrong!.correctAlternativeId).toBe(correctB.id)
  })

  it('records an attempt and counts it toward the anonymous trial', async () => {
    const before = await countAnswersBySession(db, SESSION_ID)

    const alt = await db
      .from('alternatives')
      .select('id')
      .eq('question_id', '00000000-0000-0000-0000-0000000000f2')
      .limit(1)
      .single()

    const res = await recordAnswerAttempt(db, {
      anonymousSessionId: SESSION_ID,
      questionId: '00000000-0000-0000-0000-0000000000f2',
      selectedAlternativeId: alt.data!.id,
      isCorrect: true,
    })
    expect(res.ok).toBe(true)

    const after = await countAnswersBySession(db, SESSION_ID)
    expect(after).toBe(before + 1)

    const answeredIds = await getAnsweredQuestionIdsBySession(db, SESSION_ID)
    expect(answeredIds).toContain('00000000-0000-0000-0000-0000000000f2')
  })
})
