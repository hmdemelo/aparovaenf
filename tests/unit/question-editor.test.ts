import { createElement } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QuestionEditor } from '@/features/authors/question-editor'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

describe('QuestionEditor incomplete imported drafts', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('shows pending classification and saves null fields without losing source metadata', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn(async () => ({
      json: async () => ({
        success: true,
        data: { id: 'question-1' },
      }),
    }))
    vi.stubGlobal('fetch', fetchMock)

    render(
      createElement(QuestionEditor, {
        careers: [{ id: 'career-1', name: 'Enfermeiro(a)' }],
        subjects: [
          { id: 'subject-1', name: 'Saude Publica', career_id: 'career-1' },
        ],
        boards: [],
        initial: {
          id: 'question-1',
          career_id: null,
          subject_id: null,
          board_id: null,
          difficulty: null,
          source_type: 'prova_oficial',
          source_orgao: 'PB Saude',
          source_cargo: 'Enfermeiro Intensivista',
          source_year: 2024,
          source_reference: 'IDECAN-2024-Q01',
          statement: 'Questao importada?',
          general_comment: null,
          alternatives: [
            { text: 'A', is_correct: true, alternative_comment: '' },
            { text: 'B', is_correct: false, alternative_comment: '' },
          ],
        },
      }),
    )

    expect(screen.getByTestId('pending-classification')).toHaveTextContent(
      'carreira, disciplina, dificuldade',
    )

    await user.click(screen.getByTestId('save-draft'))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    const [, request] = fetchMock.mock.calls[0] as unknown as [
      RequestInfo | URL,
      RequestInit?,
    ]
    const body = JSON.parse(String(request?.body))
    expect(body).toMatchObject({
      career_id: null,
      subject_id: null,
      difficulty: null,
      source_type: 'prova_oficial',
      source_orgao: 'PB Saude',
      source_cargo: 'Enfermeiro Intensivista',
      source_year: 2024,
      source_reference: 'IDECAN-2024-Q01',
    })
  })
})
