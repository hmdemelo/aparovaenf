import { describe, expect, it } from 'vitest'
import { computeAuthorMetrics } from '@/features/authors/author-question-service'

describe('computeAuthorMetrics', () => {
  it('returns zeroed metrics when there are no answers', () => {
    const metrics = computeAuthorMetrics(0, [])
    expect(metrics).toEqual({
      totalQuestions: 0,
      totalAnswers: 0,
      correctRate: 0,
    })
  })

  it('counts questions even when no answers were received', () => {
    const metrics = computeAuthorMetrics(5, [])
    expect(metrics.totalQuestions).toBe(5)
    expect(metrics.totalAnswers).toBe(0)
    expect(metrics.correctRate).toBe(0)
  })

  it('computes the correct rate as the fraction of correct answers', () => {
    const attempts = [
      { is_correct: true },
      { is_correct: false },
      { is_correct: true },
      { is_correct: true },
    ]
    const metrics = computeAuthorMetrics(2, attempts)
    expect(metrics.totalAnswers).toBe(4)
    expect(metrics.correctRate).toBe(0.75)
  })

  it('reports a perfect rate when every answer is correct', () => {
    const metrics = computeAuthorMetrics(1, [
      { is_correct: true },
      { is_correct: true },
    ])
    expect(metrics.correctRate).toBe(1)
  })
})
