'use client'

import { useSyncExternalStore } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, BookOpen, ChevronLeft, ChevronRight, Layers, PenTool, Users } from 'lucide-react'
import { AprovaenfLogo } from '@/features/brand/aprovaenf-logo'
import { LogoutButton } from '@/components/logout-button'

const STORAGE_KEY = 'aprovaenf:admin-sidebar-collapsed'

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

export function AdminSidebar() {
  const pathname = usePathname()
  const isCollapsed = useSyncExternalStore(
    subscribe,
    getCollapsed,
    getServerCollapsed,
  )

  function toggleSidebar() {
    setCollapsed(!isCollapsed)
  }

  // Active state matching helper
  const isRouteActive = (route: string) => {
    if (route === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(route)
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
          href="/admin"
          className={`aprova-nav-item ${isRouteActive('/admin') ? 'aprova-nav-item-active' : ''} ${isCollapsed ? 'justify-center' : ''}`}
          title="Painel"
        >
          <BarChart3 size={18} />
          {!isCollapsed && <span>Painel</span>}
        </Link>
        <Link
          href="/admin/users"
          className={`aprova-nav-item ${isRouteActive('/admin/users') ? 'aprova-nav-item-active' : ''} ${isCollapsed ? 'justify-center' : ''}`}
          title="Usuários"
        >
          <Users size={18} />
          {!isCollapsed && <span>Usuários</span>}
        </Link>
        <Link
          href="/admin/questions"
          className={`aprova-nav-item ${isRouteActive('/admin/questions') ? 'aprova-nav-item-active' : ''} ${isCollapsed ? 'justify-center' : ''}`}
          title="Questões"
        >
          <BookOpen size={18} />
          {!isCollapsed && <span>Questões</span>}
        </Link>
        <Link
          href="/admin/authors"
          className={`aprova-nav-item ${isRouteActive('/admin/authors') ? 'aprova-nav-item-active' : ''} ${isCollapsed ? 'justify-center' : ''}`}
          title="Autores"
        >
          <PenTool size={18} />
          {!isCollapsed && <span>Autores</span>}
        </Link>
        <Link
          href="/admin/subjects"
          className={`aprova-nav-item ${isRouteActive('/admin/subjects') ? 'aprova-nav-item-active' : ''} ${isCollapsed ? 'justify-center' : ''}`}
          title="Catálogos"
        >
          <Layers size={18} />
          {!isCollapsed && <span>Catálogos</span>}
        </Link>
      </nav>

      <div className="mt-auto flex w-full flex-col items-center gap-2 pt-5 max-md:mt-3 max-md:pt-0">
        <LogoutButton compact={isCollapsed} />
      </div>
    </aside>
  )
}
