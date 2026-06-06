'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { BookOpen, Heart, XCircle } from 'lucide-react'
import { StudentSidebar } from './student-sidebar'
import { AprovaenfLogo } from '@/features/brand/aprovaenf-logo'
import { AccountDialog } from '@/features/account/account-dialog'
import type { AccountProfile } from '@/features/account/account-service'

export function StudentLayout({
  account,
  careerSlug,
  isSubscriber,
  children,
}: {
  account: AccountProfile
  careerSlug: string
  isSubscriber: boolean
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentCareerSlug = searchParams.get('career') || careerSlug
  const feedHref = currentCareerSlug
    ? `/feed?career=${currentCareerSlug}`
    : '/feed'
  const isFeedPage = pathname.startsWith('/feed')

  const isActive = (path: string) => {
    if (path === '/feed') {
      return pathname.startsWith('/feed')
    }
    return pathname.startsWith(path)
  }

  return (
    <div
      className="flex min-h-dvh w-full flex-col bg-[var(--bg)] md:h-dvh md:min-h-0 md:flex-row md:overflow-hidden"
      data-testid="student-layout"
    >
      <StudentSidebar account={account} careerSlug={currentCareerSlug} />

      <div className="flex min-w-0 flex-1 flex-col md:h-full md:min-h-0 md:overflow-hidden">
        <header
          className="aprova-appbar sticky top-0 z-40 md:hidden"
          data-testid="student-mobile-header"
        >
          <div className="flex h-14 items-center justify-between gap-3 px-4">
            <Link href="/" aria-label="aprovaenf início" className="shrink-0">
              <AprovaenfLogo
                className="text-[var(--teal)]"
                markClassName="h-7 w-11"
                textClassName="text-[18px]"
              />
            </Link>
            <span
              className={`aprova-pill shrink-0 ${isSubscriber ? 'aprova-pill-pro' : ''}`}
            >
              {isSubscriber ? 'PRO' : 'Trial'}
            </span>
          </div>

          <nav
            aria-label="Navegação móvel do estudante"
            className="grid grid-cols-4 border-t border-[color:var(--line)] px-2"
            data-testid="student-mobile-nav"
          >
            <Link
              href={feedHref}
              aria-current={isActive('/feed') ? 'page' : undefined}
              className={`flex min-h-11 flex-col items-center justify-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition ${
                isActive('/feed')
                  ? 'bg-[var(--teal-light)] text-[var(--teal)]'
                  : 'text-[var(--muted)] hover:text-[var(--teal)]'
              }`}
            >
              <BookOpen size={18} />
              Estudo
            </Link>
            <Link
              href="/favorites"
              aria-current={isActive('/favorites') ? 'page' : undefined}
              className={`flex min-h-11 flex-col items-center justify-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition ${
                isActive('/favorites')
                  ? 'bg-[var(--teal-light)] text-[var(--teal)]'
                  : 'text-[var(--muted)] hover:text-[var(--teal)]'
              }`}
            >
              <Heart size={18} />
              Favoritos
            </Link>
            <Link
              href="/errors"
              aria-current={isActive('/errors') ? 'page' : undefined}
              className={`flex min-h-11 flex-col items-center justify-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition ${
                isActive('/errors')
                  ? 'bg-[var(--teal-light)] text-[var(--teal)]'
                  : 'text-[var(--muted)] hover:text-[var(--teal)]'
              }`}
            >
              <XCircle size={18} />
              Erros
            </Link>
            <AccountDialog
              initialProfile={account}
              triggerVariant="mobile-nav"
            />
          </nav>

          {isFeedPage && (
            <div className="h-2.5 w-full px-4 pb-2 pt-1">
              <div className="h-1 overflow-hidden rounded-full bg-[var(--surface)]">
                <div className="h-full w-[42%] rounded-full bg-[var(--teal-mid)]" />
              </div>
            </div>
          )}
        </header>

        <div
          className="min-w-0 flex-1 md:h-full md:min-h-0 md:overflow-y-auto"
          data-testid="student-content"
        >
          {children}
        </div>
      </div>
    </div>
  )
}
