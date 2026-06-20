'use client'

import { useSyncExternalStore } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, BookOpen, ChevronLeft, ChevronRight, Database, Plus } from 'lucide-react'
import { AprovaenfLogo } from '@/features/brand/aprovaenf-logo'
import { AccountDialog } from '@/features/account/account-dialog'
import { LogoutButton } from '@/components/logout-button'
import type { AccountProfile } from '@/features/account/account-service'

const STORAGE_KEY = 'aprovaenf:sidebar-collapsed'

// Collapsed state lives in localStorage so it persists across reloads. We read
// it through useSyncExternalStore: it stays hydration-safe (server snapshot is
// always expanded) and same-tab toggles notify subscribers manually, since
// localStorage.setItem does not emit a `storage` event in the originating tab.
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

export function AuthorSidebar({ account }: { account: AccountProfile }) {
  const pathname = usePathname()
  const isCollapsed = useSyncExternalStore(
    subscribe,
    getCollapsed,
    getServerCollapsed,
  )

  function toggleSidebar() {
    setCollapsed(!isCollapsed)
  }

  return (
    <aside
      className={`aprova-sidebar flex shrink-0 flex-col border-r px-[14px] py-5 transition-all duration-300 max-md:w-full max-md:border-r-0 max-md:border-b ${
        isCollapsed ? 'w-[72px] items-center' : 'w-[200px]'
      }`}
    >
      <div className="mb-6 flex w-full items-center justify-between max-md:mb-3">
        <AprovaenfLogo
          className="text-[var(--teal)]"
          textClassName="text-[21px]"
          compact={isCollapsed}
        />
        {!isCollapsed && (
          <button
            type="button"
            onClick={toggleSidebar}
            className="rounded p-1 text-[var(--muted)] hover:bg-[rgba(20,43,38,0.04)] max-md:hidden"
            title="Recolher barra"
            aria-label="Recolher barra"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {isCollapsed && (
        <button
          type="button"
          onClick={toggleSidebar}
          className="mb-6 rounded p-1 text-[var(--muted)] hover:bg-[rgba(20,43,38,0.04)] max-md:hidden"
          title="Expandir barra"
          aria-label="Expandir barra"
        >
          <ChevronRight size={16} />
        </button>
      )}

      <nav className="flex w-full flex-col gap-0.5 max-md:flex-row max-md:flex-wrap">
        <Link
          href="/author/questions"
          className={`aprova-nav-item ${pathname === '/author/questions' ? 'aprova-nav-item-active' : ''} ${isCollapsed ? 'justify-center' : ''}`}
          title="Questões"
        >
          <BookOpen size={18} />
          {!isCollapsed && <span>Questões</span>}
        </Link>
        <Link
          href="/author/questions/pool"
          className={`aprova-nav-item ${pathname === '/author/questions/pool' ? 'aprova-nav-item-active' : ''} ${isCollapsed ? 'justify-center' : ''}`}
          title="Banco de Questões"
        >
          <Database size={18} />
          {!isCollapsed && <span>Banco de Questões</span>}
        </Link>
        <Link
          href="/author/questions/new"
          data-testid="new-question"
          className={`aprova-nav-item ${pathname === '/author/questions/new' ? 'aprova-nav-item-active' : ''} ${isCollapsed ? 'justify-center' : ''}`}
          title="Nova questão"
        >
          <Plus size={18} />
          {!isCollapsed && <span>Nova questão</span>}
        </Link>
        <span
          className={`aprova-nav-item pointer-events-none opacity-70 ${isCollapsed ? 'justify-center' : ''}`}
          title="Métricas"
        >
          <BarChart3 size={18} />
          {!isCollapsed && <span>Métricas</span>}
        </span>
      </nav>

      <div className="mt-auto flex w-full flex-col items-center gap-2 pt-5 max-md:mt-3 max-md:pt-0">
        <AccountDialog initialProfile={account} compact={isCollapsed} />
        <LogoutButton compact={isCollapsed} />
      </div>
    </aside>
  )
}
