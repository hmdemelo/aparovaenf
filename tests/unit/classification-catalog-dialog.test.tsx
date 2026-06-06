import { createElement } from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { ClassificationCatalogDialog } from '@/features/authors/classification-catalog-dialog'

describe('ClassificationCatalogDialog unit tests', () => {
  const mockCareers = [{ id: 'career-1', name: 'Enfermeiro(a)' }]
  const mockClose = vi.fn()
  const mockSelectDiscipline = vi.fn()
  const mockSelectBoard = vi.fn()
  const mockConfirmTopics = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Stub fetch globally for list queries
    const fetchMock = vi.fn(async (url: string) => {
      let items: unknown[] = []
      if (url.includes('/api/author/disciplines')) {
        items = [
          {
            id: 'subject-1',
            name: 'Saúde da Família',
            created_by: { label: 'Martinho', is_current_user: false },
            created_at: '2026-06-05T00:00:00Z',
            career: { id: 'career-1', name: 'Enfermeiro(a)' }
          }
        ]
      } else if (url.includes('/api/author/boards')) {
        items = [
          {
            id: 'board-1',
            name: 'IDECAN',
            created_by: { label: 'Sistema', is_current_user: false },
            created_at: '2026-06-05T00:00:00Z'
          }
        ]
      } else if (url.includes('/api/author/topics')) {
        items = [
          {
            id: 'topic-1',
            name: 'Imunização',
            created_by: { label: 'Você', is_current_user: true },
            created_at: '2026-06-05T00:00:00Z'
          }
        ]
      }

      return {
        json: async () => ({
          success: true,
          data: {
            items,
            pagination: { page: 1, page_size: 20, total: items.length, total_pages: 1 }
          }
        })
      }
    })
    vi.stubGlobal('fetch', fetchMock)
  })

  it('renders modal header, search, and list items', async () => {
    render(
      createElement(ClassificationCatalogDialog, {
        isOpen: true,
        onClose: mockClose,
        careers: mockCareers,
        currentCareerId: 'career-1',
        onSelectDiscipline: mockSelectDiscipline,
        onSelectBoard: mockSelectBoard,
        selectedTopicIds: [],
        selectedTopics: [],
        onConfirmTopics: mockConfirmTopics,
      })
    )

    expect(screen.getByText('Gerenciar classificações')).toBeInTheDocument()
    
    // Switch to disciplines tab list items should show up
    await waitFor(() => {
      expect(screen.getByText('Saúde da Família')).toBeInTheDocument()
    })
  })

  it('selects a discipline and closes dialog', async () => {
    render(
      createElement(ClassificationCatalogDialog, {
        isOpen: true,
        onClose: mockClose,
        careers: mockCareers,
        currentCareerId: 'career-1',
        onSelectDiscipline: mockSelectDiscipline,
        onSelectBoard: mockSelectBoard,
        selectedTopicIds: [],
        selectedTopics: [],
        onConfirmTopics: mockConfirmTopics,
      })
    )

    await waitFor(() => {
      expect(screen.getByText('Saúde da Família')).toBeInTheDocument()
    })

    const selectBtn = screen.getByText('Selecionar')
    fireEvent.click(selectBtn)

    expect(mockSelectDiscipline).toHaveBeenCalledWith({ id: 'subject-1', name: 'Saúde da Família' })
    expect(mockClose).toHaveBeenCalledTimes(1)
  })

  it('switches tabs to Bancas and fetches boards', async () => {
    render(
      createElement(ClassificationCatalogDialog, {
        isOpen: true,
        onClose: mockClose,
        careers: mockCareers,
        currentCareerId: 'career-1',
        onSelectDiscipline: mockSelectDiscipline,
        onSelectBoard: mockSelectBoard,
        selectedTopicIds: [],
        selectedTopics: [],
        onConfirmTopics: mockConfirmTopics,
      })
    )

    // Switch to Bancas tab
    const bancasTab = screen.getByText('Bancas')
    fireEvent.click(bancasTab)

    await waitFor(() => {
      expect(screen.getByText('IDECAN')).toBeInTheDocument()
    })
  })
})
