import { describe, expect, it } from 'vitest'
import {
  aggregateAttempts,
  type AttemptRow,
} from '@/features/student-feed/performance-stats-service'

const rows: AttemptRow[] = [
  { isCorrect: true, subject: 'Fundamentos', board: 'FGV' },
  { isCorrect: false, subject: 'Fundamentos', board: 'FGV' },
  { isCorrect: true, subject: 'Fundamentos', board: 'Cebraspe' },
  { isCorrect: true, subject: 'Saúde Coletiva', board: null },
]

describe('aggregateAttempts', () => {
  it('computes the overall accuracy', () => {
    const stats = aggregateAttempts(rows)
    expect(stats.total).toBe(4)
    expect(stats.correct).toBe(3)
    expect(stats.accuracy).toBe(75)
  })

  it('groups accuracy by subject, largest bucket first', () => {
    const stats = aggregateAttempts(rows)
    expect(stats.bySubject).toEqual([
      { name: 'Fundamentos', total: 3, correct: 2, accuracy: 67 },
      { name: 'Saúde Coletiva', total: 1, correct: 1, accuracy: 100 },
    ])
  })

  it('groups accuracy by board and skips rows without one', () => {
    const stats = aggregateAttempts(rows)
    expect(stats.byBoard).toEqual([
      { name: 'FGV', total: 2, correct: 1, accuracy: 50 },
      { name: 'Cebraspe', total: 1, correct: 1, accuracy: 100 },
    ])
  })

  it('returns zeroed stats when there are no attempts', () => {
    const stats = aggregateAttempts([])
    expect(stats).toEqual({
      total: 0,
      correct: 0,
      accuracy: 0,
      bySubject: [],
      byBoard: [],
    })
  })
})
