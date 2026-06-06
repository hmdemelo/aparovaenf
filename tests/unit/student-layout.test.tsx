import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { StudentLayout } from '@/components/student-layout'
import { StudentSidebar } from '@/components/student-sidebar'
import type { AccountProfile } from '@/features/account/account-service'

const navigation = vi.hoisted(() => ({
  pathname: '/feed',
  search: '',
  push: vi.fn(),
  refresh: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
  useSearchParams: () => new URLSearchParams(navigation.search),
  useRouter: () => ({
    push: navigation.push,
    refresh: navigation.refresh,
  }),
}))

vi.mock('@/lib/db/browser', () => ({
  createSupabaseBrowserClient: () => ({
    auth: {
      signInWithPassword: vi.fn(),
      updateUser: vi.fn(),
      signOut: vi.fn(),
    },
  }),
}))

const account: AccountProfile = {
  email: 'aluno@aprovaenf.local',
  name: 'Aluno',
  displayName: 'Aluno',
  shortBio: '',
  instagram: '',
  isPayingOrExPaying: false,
}

describe('StudentLayout', () => {
  beforeEach(() => {
    navigation.pathname = '/feed'
    navigation.search = ''
    navigation.push.mockReset()
    navigation.refresh.mockReset()
    localStorage.clear()
  })

  it('renders a full viewport shell with desktop sidebar and mobile top navigation', () => {
    const { container } = render(
      <StudentLayout
        account={account}
        careerSlug="enfermeiro-a"
        isSubscriber={false}
      >
        <div>Conteúdo</div>
      </StudentLayout>,
    )

    expect(screen.getByTestId('student-layout')).toHaveClass(
      'min-h-dvh',
      'md:h-dvh',
      'w-full',
      'md:overflow-hidden',
    )
    expect(screen.getByTestId('student-sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('student-mobile-header')).toBeInTheDocument()
    expect(screen.getByTestId('student-mobile-nav')).toBeInTheDocument()
    expect(screen.getByText('Conta')).toBeVisible()
    expect(screen.getByText('Trial')).toBeVisible()
    expect(container.querySelector('.aprova-bottom-nav')).not.toBeInTheDocument()
  })

  it('marks the current mobile route and keeps the selected career in the study link', () => {
    navigation.pathname = '/favorites'
    navigation.search = 'career=tecnico-em-enfermagem'

    render(
      <StudentLayout
        account={account}
        careerSlug="enfermeiro-a"
        isSubscriber
      >
        <div>Conteúdo</div>
      </StudentLayout>,
    )

    const mobileNav = screen.getByTestId('student-mobile-nav')

    expect(screen.getAllByRole('link', { name: 'Estudo' })).toHaveLength(2)
    for (const studyLink of screen.getAllByRole('link', { name: 'Estudo' })) {
      expect(studyLink).toHaveAttribute(
        'href',
        '/feed?career=tecnico-em-enfermagem',
      )
    }
    expect(
      within(mobileNav).getByRole('link', { name: 'Favoritos' }),
    ).toHaveAttribute('aria-current', 'page')
    expect(screen.getByText('PRO')).toBeVisible()
  })
})

describe('StudentSidebar', () => {
  beforeEach(() => {
    navigation.pathname = '/feed'
    navigation.search = ''
    localStorage.clear()
  })

  it('persists collapsed state and restores it on remount', () => {
    const { unmount } = render(
      <StudentSidebar account={account} careerSlug="enfermeiro-a" />,
    )

    const sidebar = screen.getByTestId('student-sidebar')
    expect(sidebar).toHaveAttribute('data-collapsed', 'false')
    expect(screen.getByText('Favoritos')).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: 'Recolher menu' }))

    expect(localStorage.getItem('aprovaenf:student-sidebar-collapsed')).toBe(
      'true',
    )
    expect(sidebar).toHaveAttribute('data-collapsed', 'true')
    expect(screen.queryByText('Favoritos')).not.toBeInTheDocument()

    unmount()
    render(
      <StudentSidebar account={account} careerSlug="enfermeiro-a" />,
    )

    expect(screen.getByTestId('student-sidebar')).toHaveAttribute(
      'data-collapsed',
      'true',
    )
    expect(
      screen.getByRole('button', { name: 'Expandir menu' }),
    ).toBeInTheDocument()
  })
})
