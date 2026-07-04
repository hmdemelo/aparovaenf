'use client'

import { useSyncExternalStore } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, BookOpen, ChevronLeft, ChevronRight, Heart, History, XCircle } from 'lucide-react'
import { AprovaenfLogo } from '@/features/brand/aprovaenf-logo'
import { AccountDialog } from '@/features/account/account-dialog'
import { LogoutButton } from '@/components/logout-button'
import type { AccountProfile } from '@/features/account/account-service'

const STORAGE_KEY = 'aprovaenf:student-sidebar-collapsed'

const listeners = new Set<() => void>()

function subscribe(callback: () => void) {
  listeners.add(callback)
  window.addEventListener('storage', callback)
  return () => {
    listeners.delete(callback)
    window.removeEventListener('storage', callback)
  }
}

function getCollapsed(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true'
}

function getServerCollapsed(): boolean {
  return false
}

function setCollapsed(value: boolean) {
  localStorage.setItem(STORAGE_KEY, String(value))
  listeners.forEach((listener) => listener())
}

export function StudentSidebar({
  account,
  careerSlug,
}: {
  account: AccountProfile
  careerSlug: string
}) {
  const pathname = usePathname()
  const isCollapsed = useSyncExternalStore(
    subscribe,
    getCollapsed,
    getServerCollapsed,
  )

  function toggleSidebar() {
    setCollapsed(!isCollapsed)
  }

  const isRouteActive = (route: string) => {
    if (route === '/feed') {
      return pathname === '/feed'
    }
    return pathname.startsWith(route)
  }

  const feedHref = careerSlug ? `/feed?career=${careerSlug}` : '/feed'

  return (
    <aside
      aria-label="Navegação do estudante"
      data-testid="student-sidebar"
      data-collapsed={isCollapsed}
      className={`aprova-sidebar flex shrink-0 flex-col border-r px-[14px] py-5 transition-all duration-300 max-md:hidden ${
        isCollapsed ? 'w-[72px] items-center' : 'w-[200px]'
      }`}
    >
      <div className="mb-6 flex w-full items-center justify-between">
        <AprovaenfLogo
          className="text-[var(--teal)]"
          markClassName={isCollapsed ? 'h-7 w-10' : ''}
          textClassName="text-[21px]"
          compact={isCollapsed}
        />
        {!isCollapsed && (
          <button
            type="button"
            onClick={toggleSidebar}
            className="rounded p-1 text-[var(--muted)] hover:bg-[rgba(20,43,38,0.04)]"
            title="Recolher barra"
            aria-label="Recolher menu"
            aria-expanded="true"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {isCollapsed && (
        <button
          type="button"
          onClick={toggleSidebar}
          className="mb-6 rounded p-1 text-[var(--muted)] hover:bg-[rgba(20,43,38,0.04)]"
          title="Expandir barra"
          aria-label="Expandir menu"
          aria-expanded="false"
        >
          <ChevronRight size={16} />
        </button>
      )}

      <nav className="flex w-full flex-col gap-0.5">
        <Link
          href={feedHref}
          className={`aprova-nav-item ${isRouteActive('/feed') ? 'aprova-nav-item-active' : ''} ${isCollapsed ? 'justify-center' : ''}`}
          title="Estudo"
          aria-current={isRouteActive('/feed') ? 'page' : undefined}
        >
          <BookOpen size={18} />
          {!isCollapsed && <span>Estudo</span>}
        </Link>
        <Link
          href="/favorites"
          className={`aprova-nav-item ${isRouteActive('/favorites') ? 'aprova-nav-item-active' : ''} ${isCollapsed ? 'justify-center' : ''}`}
          title="Favoritos"
          aria-current={isRouteActive('/favorites') ? 'page' : undefined}
        >
          <Heart size={18} />
          {!isCollapsed && <span>Favoritos</span>}
        </Link>
        <Link
          href="/errors"
          className={`aprova-nav-item ${isRouteActive('/errors') ? 'aprova-nav-item-active' : ''} ${isCollapsed ? 'justify-center' : ''}`}
          title="Erros"
          aria-current={isRouteActive('/errors') ? 'page' : undefined}
        >
          <XCircle size={18} />
          {!isCollapsed && <span>Erros</span>}
        </Link>
        <Link
          href="/history"
          className={`aprova-nav-item ${isRouteActive('/history') ? 'aprova-nav-item-active' : ''} ${isCollapsed ? 'justify-center' : ''}`}
          title="Histórico"
          aria-current={isRouteActive('/history') ? 'page' : undefined}
        >
          <History size={18} />
          {!isCollapsed && <span>Histórico</span>}
        </Link>
        <Link
          href="/estatisticas"
          className={`aprova-nav-item ${isRouteActive('/estatisticas') ? 'aprova-nav-item-active' : ''} ${isCollapsed ? 'justify-center' : ''}`}
          title="Estatísticas"
          aria-current={isRouteActive('/estatisticas') ? 'page' : undefined}
        >
          <BarChart3 size={18} />
          {!isCollapsed && <span>Estatísticas</span>}
        </Link>
      </nav>

      <div className="mt-auto flex w-full flex-col items-center gap-2 pt-5">
        <AccountDialog initialProfile={account} compact={isCollapsed} />
        <LogoutButton compact={isCollapsed} />
      </div>
    </aside>
  )
}
