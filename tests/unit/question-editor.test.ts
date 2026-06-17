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

  it('shows a discipline created from the catalog as selected', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn(async (_url: RequestInfo | URL, request?: RequestInit) => {
      if (request?.method === 'POST') {
        return {
          json: async () => ({
            success: true,
            data: {
              created: true,
              item: { id: 'subject-new', name: 'Cuidados Paliativos' },
            },
          }),
        }
      }
      return {
        json: async () => ({
          success: true,
          data: {
            items: [],
            pagination: { page: 1, page_size: 20, total: 0, total_pages: 0 },
          },
        }),
      }
    })
    vi.stubGlobal('fetch', fetchMock)

    render(
      createElement(QuestionEditor, {
        careers: [{ id: 'career-1', name: 'Enfermeiro(a)' }],
        subjects: [],
        boards: [],
      }),
    )

    await user.click(screen.getByTestId('discipline-catalog'))
    await user.click(screen.getByTestId('catalog-create-toggle'))
    await user.type(screen.getByTestId('catalog-create-name'), 'Cuidados Paliativos')
    await user.click(screen.getByTestId('catalog-create-submit'))

    await waitFor(() => {
      expect(screen.getByTestId('subject-value')).toHaveTextContent(
        'Cuidados Paliativos',
      )
    })
  })

  it('allows clicking an alternative to mark it as correct', async () => {
    const user = userEvent.setup()
    render(
      createElement(QuestionEditor, {
        careers: [{ id: 'career-1', name: 'Enfermeiro(a)' }],
        subjects: [],
        boards: [],
      }),
    )

    const radio0 = screen.getByTestId('correct-0') as HTMLInputElement
    const radio1 = screen.getByTestId('correct-1') as HTMLInputElement

    expect(radio0.checked).toBe(true)
    expect(radio1.checked).toBe(false)

    // Click the label of the second radio or the radio itself
    await user.click(radio1)

    expect(radio0.checked).toBe(false)
    expect(radio1.checked).toBe(true)
  })
})
