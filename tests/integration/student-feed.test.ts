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
    }
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
