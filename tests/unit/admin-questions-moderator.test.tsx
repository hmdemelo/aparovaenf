import { createElement } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { QuestionModerator } from '@/features/admin/question-moderator'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}))

const mockQuestions = [
  {
    id: 'q-1',
    statement: 'Primeira questão sobre vacinas',
    status: 'published',
    difficulty: 'facil',
    author: 'Dra. Ana',
    subject: 'Imunologia',
    createdAt: '2026-06-01T10:00:00.000Z',
  },
  {
    id: 'q-2',
    statement: 'Segunda questão sobre curativos',
    status: 'draft',
    difficulty: 'media',
    author: 'Prof. Carlos',
    subject: 'Fundamentos',
    createdAt: '2026-06-02T12:00:00.000Z',
  },
]

const mockSubjects = [
  { id: 'sub-1', name: 'Imunologia', career_id: 'car-1' },
  { id: 'sub-2', name: 'Fundamentos', career_id: 'car-1' },
]

const mockBoards = [
  { id: 'board-1', name: 'CESPE' },
  { id: 'board-2', name: 'COSEAC' },
]

describe('QuestionModerator Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { questions: [] } }),
    })
  })

  it('renders initial list of questions, subjects and boards in filters', () => {
    render(
      createElement(QuestionModerator, {
        initialQuestions: mockQuestions,
        initialPagination: { page: 1, pageSize: 30, total: 62, totalPages: 3 },
        subjects: mockSubjects,
        boards: mockBoards,
      })
    )

    // Table rows
    expect(screen.getByText('Primeira questão sobre vacinas')).toBeInTheDocument()
    expect(screen.getByText('Segunda questão sobre curativos')).toBeInTheDocument()

    // Filters options
    expect(screen.getByRole('option', { name: 'Imunologia' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'CESPE' })).toBeInTheDocument()
  })

  it('sorts questions in memory when clicking column headers', async () => {
    const user = userEvent.setup()
    render(
      createElement(QuestionModerator, {
        initialQuestions: mockQuestions,
        initialPagination: { page: 1, pageSize: 30, total: 62, totalPages: 3 },
        subjects: mockSubjects,
        boards: mockBoards,
      })
    )

    // Initial state check: first row contains Primeira...
    const rowsBefore = screen.getAllByRole('row')
    expect(rowsBefore[1]).toHaveTextContent('Primeira questão')

    // Click on "Enunciado" header to sort by statement ascending
    // Carlos (Segunda) vs Ana (Primeira) -> P comes first, but wait: Let's check
    // "Primeira" vs "Segunda" -> "Primeira" < "Segunda". Ascending order should keep "Primeira" first.
    // If we click again, it should toggle to descending, bringing "Segunda" to the first slot.
    const enunciadoHeader = screen.getByText(/Enunciado/i)
    await user.click(enunciadoHeader) // asc: Primeira, Segunda
    await user.click(enunciadoHeader) // desc: Segunda, Primeira

    const rowsAfter = screen.getAllByRole('row')
    expect(rowsAfter[1]).toHaveTextContent('Segunda questão')
  })

  it('does not trigger automatic fetch on typing search input', async () => {
    const user = userEvent.setup()
    render(
      createElement(QuestionModerator, {
        initialQuestions: mockQuestions,
        initialPagination: { page: 1, pageSize: 30, total: 62, totalPages: 3 },
        subjects: mockSubjects,
        boards: mockBoards,
      })
    )

    const searchInput = screen.getByPlaceholderText('Pesquisar enunciado...')
    await user.type(searchInput, 'vacina')

    // Typing should not trigger fetch
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('triggers fetch when submit (Buscar) is clicked', async () => {
    const user = userEvent.setup()
    render(
      createElement(QuestionModerator, {
        initialQuestions: mockQuestions,
        initialPagination: { page: 1, pageSize: 30, total: 62, totalPages: 3 },
        subjects: mockSubjects,
        boards: mockBoards,
      })
    )

    const searchInput = screen.getByPlaceholderText('Pesquisar enunciado...')
    await user.type(searchInput, 'vacina')

    const buscarBtn = screen.getByRole('button', { name: 'Buscar' })
    await user.click(buscarBtn)

    // Submitting form should trigger fetch
    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/questions?limit=30&q=vacina')
    )
  })

  it('loads the next page while preserving the 30-item page size', async () => {
    const user = userEvent.setup()
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          data: {
            questions: mockQuestions,
            pagination: {
              page: 2,
              pageSize: 30,
              total: 62,
              totalPages: 3,
            },
          },
        }),
    })

    render(
      createElement(QuestionModerator, {
        initialQuestions: mockQuestions,
        initialPagination: { page: 1, pageSize: 30, total: 62, totalPages: 3 },
        subjects: mockSubjects,
        boards: mockBoards,
      }),
    )

    await user.click(screen.getByRole('button', { name: 'Próxima página' }))

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('page=2'),
    )
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('limit=30'),
    )
  })
})
