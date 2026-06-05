import { createElement } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { BulkQuestionImportDialog } from '@/features/admin/bulk-question-import-dialog'

describe('BulkQuestionImportDialog', () => {
  it('selects a CSV, submits it, and shows the result summary', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const onImported = vi.fn()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            author_id: '00000000-0000-0000-0000-000000000001',
            file_name: 'questoes.csv',
            total_rows: 2,
            imported: 1,
            failed: 1,
            created_question_ids: ['created-question-1'],
            warnings: [
              {
                line: 2,
                field: 'difficulty',
                message: 'Dificuldade não reconhecida.',
              },
            ],
            errors: [
              {
                line: 3,
                field: 'subject',
                message: 'Disciplina nao encontrada.',
              },
            ],
          },
        }),
      })),
    )

    render(
      createElement(BulkQuestionImportDialog, {
        author: {
          id: '00000000-0000-0000-0000-000000000001',
          displayName: 'Profa. Maria',
        },
        onClose,
        onImported,
      }),
    )

    await user.upload(
      screen.getByTestId('bulk-import-file'),
      new File(['career;subject\n'], 'questoes.csv', { type: 'text/csv' }),
    )
    await user.click(screen.getByTestId('bulk-import-submit'))

    await waitFor(() => expect(onImported).toHaveBeenCalled())
    expect(screen.getByText('1 importada')).toBeInTheDocument()
    expect(screen.getByText('1 falhou')).toBeInTheDocument()
    expect(screen.getByText('1 aviso')).toBeInTheDocument()
    expect(screen.getByText(/Dificuldade não reconhecida/)).toBeInTheDocument()
    expect(screen.getByText(/Linha 3/)).toBeInTheDocument()
  })

  it('keeps submit disabled until a CSV file is selected', () => {
    render(
      createElement(BulkQuestionImportDialog, {
        author: {
          id: '00000000-0000-0000-0000-000000000001',
          displayName: 'Profa. Maria',
        },
        onClose: vi.fn(),
        onImported: vi.fn(),
      }),
    )

    expect(screen.getByTestId('bulk-import-submit')).toBeDisabled()
    expect(screen.getByRole('link', { name: /baixar template/i })).toHaveAttribute(
      'href',
      '/api/admin/questions/bulk-template',
    )
  })
})
