'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/db/browser'

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={`aprova-nav-item text-left flex items-center rounded-[10px] text-sm text-[var(--muted)] hover:bg-[rgba(20,43,38,0.04)] hover:text-[var(--ink)] cursor-pointer ${
        compact ? 'justify-center w-10 h-10 p-0' : 'w-full gap-2'
      }`}
      title={compact ? 'Sair da conta' : undefined}
    >
      <LogOut size={18} />
      {!compact && 'Sair da conta'}
    </button>
  )
}
