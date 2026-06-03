'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/db/browser'

export function LogoutButton() {
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
      className="aprova-nav-item w-full text-left flex items-center gap-2 rounded-[10px] text-sm text-[var(--muted)] hover:bg-[rgba(20,43,38,0.04)] hover:text-[var(--ink)] cursor-pointer"
    >
      <LogOut size={18} />
      Sair da conta
    </button>
  )
}
