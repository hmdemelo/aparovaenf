import { createElement } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { AdminAuthorRow } from '@/features/admin/admin-service'
import { AdminAuthorsManager } from '@/features/admin/admin-authors-manager'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}))

const authors: AdminAuthorRow[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    userId: '00000000-0000-0000-0000-000000000101',
    displayName: 'Profa. Maria',
    email: 'maria@example.com',
    shortBio: 'Enfermeira aprovada.',
    instagram: '@maria',
    isPublic: true,
    questionCount: 4,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
]

describe('AdminAuthorsManager', () => {
  it('keeps create/edit forms behind dialogs', async () => {
    const user = userEvent.setup()
    render(createElement(AdminAuthorsManager, { authors }))

    expect(screen.queryByTestId('create-author-form')).not.toBeInTheDocument()
    expect(screen.queryByTestId('edit-author-form')).not.toBeInTheDocument()

    await user.click(screen.getByTestId('open-create-author'))
    expect(screen.getByTestId('create-author-form')).toBeInTheDocument()

    await user.click(screen.getByTestId('dialog-close'))
    expect(screen.queryByTestId('create-author-form')).not.toBeInTheDocument()

    await user.click(screen.getByTestId('open-edit-author'))
    expect(screen.getByTestId('edit-author-form')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Profa. Maria')).toBeInTheDocument()
  })
})
