'use client'

import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/db/browser'
import { buildAuthCallbackUrl } from '@/lib/validation/schemas'

type GoogleAuthButtonProps = {
  next: string
  label?: string
  onError?: (message: string) => void
}

export function GoogleAuthButton({
  next,
  label = 'Continuar com o Google',
  onError,
}: GoogleAuthButtonProps) {
  const [loading, setLoading] = useState(false)

  async function startGoogleAuth() {
    setLoading(true)
    onError?.('')

    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: buildAuthCallbackUrl(window.location.origin, next),
      },
    })

    if (error) {
      onError?.('Não foi possível iniciar o login com Google.')
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      data-testid="google-auth"
      disabled={loading}
      onClick={startGoogleAuth}
      className="aprova-button aprova-button-ghost w-full py-3.5 text-[15px] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? (
        <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
      ) : (
        <span
          aria-hidden="true"
          className="grid h-5 w-5 place-items-center rounded-full border border-[color:var(--line-2)] bg-white text-xs font-bold text-[#4285f4]"
        >
          G
        </span>
      )}
      {loading ? 'Abrindo Google...' : label}
    </button>
  )
}
