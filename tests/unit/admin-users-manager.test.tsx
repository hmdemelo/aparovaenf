import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AdminUsersManager } from '@/features/admin/admin-users-manager'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

const users = [
  {
    id: 'user-1',
    name: 'Ana Assinante',
    email: 'ana@example.com',
    role: 'student',
    createdAt: '2026-06-01T10:00:00.000Z',
    subscriptionStatus: 'active',
    subscriptionPlan: 'annual',
    subscriptionPeriodEnd: '2027-06-01T10:00:00.000Z',
    registrationCompleted: true,
    forcePasswordChange: false,
    answeredCount: 18,
  },
  {
    id: 'user-2',
    name: 'Bruno Pendente',
    email: 'bruno@example.com',
    role: 'author',
    createdAt: '2026-06-02T10:00:00.000Z',
    subscriptionStatus: null,
    subscriptionPlan: null,
    subscriptionPeriodEnd: null,
    registrationCompleted: true,
    forcePasswordChange: true,
    answeredCount: 1,
  },
]

describe('AdminUsersManager', () => {
  it('shows subscription, trial and forced-password management context', () => {
    render(<AdminUsersManager users={users} />)

    expect(screen.getByText('Plano anual')).toBeInTheDocument()
    expect(screen.getByText('18 respostas')).toBeInTheDocument()
    expect(screen.getAllByText('Troca de senha pendente')).toHaveLength(2)
  })

  it('filters users locally by search and access state', async () => {
    const user = userEvent.setup()
    render(<AdminUsersManager users={users} />)

    await user.type(
      screen.getByPlaceholderText('Buscar por nome ou e-mail...'),
      'bruno',
    )

    expect(screen.queryByText('ana@example.com')).not.toBeInTheDocument()
    expect(screen.getByText('bruno@example.com')).toBeInTheDocument()

    await user.clear(
      screen.getByPlaceholderText('Buscar por nome ou e-mail...'),
    )
    await user.selectOptions(
      screen.getByLabelText('Filtrar por acesso'),
      'active',
    )

    expect(screen.getByText('ana@example.com')).toBeInTheDocument()
    expect(screen.queryByText('bruno@example.com')).not.toBeInTheDocument()
  })
})
