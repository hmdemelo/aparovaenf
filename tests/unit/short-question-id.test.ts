import { describe, expect, test } from 'vitest'
import { shortQuestionId } from '@/lib/utils/short-question-id'

describe('shortQuestionId', () => {
  test('returns the first 8 hex chars of the UUID, uppercased', () => {
    expect(shortQuestionId('d9f825b7-66a8-4d19-9b7e-8908a6b5b005')).toBe(
      'D9F825B7',
    )
  })

  test('strips hyphens before slicing so the first block is preserved', () => {
    // A short first block must not pull the hyphen into the result.
    expect(shortQuestionId('abc-1234-5678-9012-345678901234')).toBe('ABC12345')
  })

  test('already-uppercase input stays stable', () => {
    expect(shortQuestionId('D9F825B7-66A8-4D19-9B7E-8908A6B5B005')).toBe(
      'D9F825B7',
    )
  })
})
