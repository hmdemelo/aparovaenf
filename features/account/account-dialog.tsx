'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CreditCard, History, KeyRound, Save, UserCircle, X } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/db/browser'
import { useScrollLock } from '@/lib/hooks/use-scroll-lock'
import type { AccountProfile } from './account-service'

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } }

type AccountDialogProps = {
  initialProfile: AccountProfile
  compact?: boolean
  triggerVariant?: 'default' | 'compact' | 'mobile-nav'
}

export function AccountDialog({
  initialProfile,
  compact = false,
  triggerVariant,
}: AccountDialogProps) {
  const router = useRouter()
  const resolvedTriggerVariant =
    triggerVariant ?? (compact ? 'compact' : 'default')
  const [open, setOpen] = useState(false)
  const [profile, setProfile] = useState(initialProfile)
  const [name, setName] = useState(initialProfile.name)
  const [displayName, setDisplayName] = useState(initialProfile.displayName)
  const [shortBio, setShortBio] = useState(initialProfile.shortBio)
  const [instagram, setInstagram] = useState(initialProfile.instagram)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [profileStatus, setProfileStatus] = useState<string | null>(null)
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [cancelingSubscription, setCancelingSubscription] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [cancelStatus, setCancelStatus] = useState<string | null>(null)

  useScrollLock(open)

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault()
    setSavingProfile(true)
    setProfileStatus(null)
    setProfileError(null)

    try {
      const response = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          display_name: displayName,
          short_bio: shortBio,
          instagram,
        }),
      })
      const json: ApiEnvelope<{ profile: AccountProfile }> = await response.json()
      if (!json.success) {
        setProfileError(json.error.message)
        return
      }
      setProfile(json.data.profile)
      setName(json.data.profile.name)
      setDisplayName(json.data.profile.displayName)
      setShortBio(json.data.profile.shortBio)
      setInstagram(json.data.profile.instagram)
      setProfileStatus('Dados atualizados.')
      router.refresh()
    } catch {
      setProfileError('Não foi possível atualizar os dados.')
    } finally {
      setSavingProfile(false)
    }
  }

  async function savePassword(event: React.FormEvent) {
    event.preventDefault()
    setSavingPassword(true)
    setPasswordStatus(null)
    setPasswordError(null)

    if (!profile.email) {
      setPasswordError('Sua conta não tem e-mail disponível para validar a senha.')
      setSavingPassword(false)
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('A nova senha e a confirmação não conferem.')
      setSavingPassword(false)
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('A nova senha deve ter pelo menos 8 caracteres.')
      setSavingPassword(false)
      return
    }

    try {
      const supabase = createSupabaseBrowserClient()
      const signed = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: currentPassword,
      })
      if (signed.error) {
        setPasswordError('Senha atual inválida.')
        return
      }

      const updated = await supabase.auth.updateUser({ password: newPassword })
      if (updated.error) {
        setPasswordError('Não foi possível alterar a senha.')
        return
      }

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordStatus('Senha alterada.')
    } catch {
      setPasswordError('Não foi possível alterar a senha.')
    } finally {
      setSavingPassword(false)
    }
  }

  async function cancelSubscription() {
    const confirmed = window.confirm(
      'Cancelar a renovação da assinatura? Você mantém o acesso até o fim do período já pago.',
    )
    if (!confirmed) return

    setCancelingSubscription(true)
    setCancelError(null)
    setCancelStatus(null)

    try {
      const response = await fetch('/api/billing/cancel', { method: 'POST' })
      const json: ApiEnvelope<{ canceled: boolean; access_until: string | null }> =
        await response.json()
      if (!json.success) {
        setCancelError('Não foi possível cancelar a assinatura.')
        return
      }
      const until = json.data.access_until
        ? new Date(json.data.access_until).toLocaleDateString('pt-BR')
        : null
      setCancelStatus(
        until
          ? `Renovação cancelada. Seu acesso continua até ${until}.`
          : 'Renovação cancelada.',
      )
    } catch {
      setCancelError('Não foi possível cancelar a assinatura.')
    } finally {
      setCancelingSubscription(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center justify-center text-[var(--ink)] transition hover:text-[var(--teal)] ${
          resolvedTriggerVariant === 'mobile-nav'
            ? 'min-h-11 flex-col gap-1 rounded-md px-2 py-1 text-[11px] font-semibold'
            : `rounded-[var(--radius-sm)] border border-[color:var(--line-2)] bg-white ${
                resolvedTriggerVariant === 'compact'
                  ? 'h-10 w-10 p-0'
                  : 'gap-2 px-4 py-2 text-sm font-semibold'
              }`
        }`}
        title={
          resolvedTriggerVariant === 'compact' ? 'Minha conta' : undefined
        }
        aria-label={
          resolvedTriggerVariant === 'compact' ? 'Minha conta' : undefined
        }
        data-testid="account-open"
      >
        <UserCircle size={18} />
        {resolvedTriggerVariant === 'mobile-nav'
          ? 'Conta'
          : resolvedTriggerVariant === 'default'
            ? 'Minha conta'
            : null}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(26,43,38,0.45)] px-4 py-6"
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-title"
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-[20px] border border-[color:var(--line)] bg-white shadow-[0_30px_60px_-32px_rgba(20,43,38,0.4)]"
            data-testid="account-dialog"
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-[color:var(--line)] bg-white px-5 py-4">
              <div>
                <h2
                  id="account-title"
                  className="text-[21px] font-semibold text-[var(--ink)]"
                >
                  Minha conta
                </h2>
                <p className="text-sm text-[var(--muted)]">{profile.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar"
                className="rounded-full p-2 text-[var(--muted)] transition hover:bg-[#f6f4ef] hover:text-[var(--ink)]"
                data-testid="account-close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid gap-6 p-5 md:grid-cols-[1fr_0.9fr]">
              <form onSubmit={saveProfile} className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
                  <UserCircle size={18} className="text-[var(--teal)]" />
                  Dados do perfil
                </div>

                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-[var(--muted)]">Nome</span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    maxLength={120}
                    className="aprova-field"
                    data-testid="account-name"
                  />
                </label>

                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-[var(--muted)]">
                    Nome de exibição
                  </span>
                  <input
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    required
                    maxLength={120}
                    className="aprova-field"
                    data-testid="account-display-name"
                  />
                </label>

                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-[var(--muted)]">Instagram</span>
                  <input
                    value={instagram}
                    onChange={(event) => setInstagram(event.target.value)}
                    maxLength={60}
                    placeholder="@perfil"
                    className="aprova-field"
                    data-testid="account-instagram"
                  />
                </label>

                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-[var(--muted)]">Bio</span>
                  <textarea
                    value={shortBio}
                    onChange={(event) => setShortBio(event.target.value)}
                    maxLength={280}
                    rows={4}
                    className="aprova-field resize-none"
                    data-testid="account-bio"
                  />
                </label>

                {profileError && (
                  <p className="rounded-[var(--radius-sm)] bg-[var(--danger-bg)] px-3 py-2 text-sm text-[var(--danger)]">
                    {profileError}
                  </p>
                )}
                {profileStatus && (
                  <p className="rounded-[var(--radius-sm)] bg-[var(--teal-light)] px-3 py-2 text-sm text-[var(--teal-ink)]">
                    {profileStatus}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="aprova-button disabled:bg-[var(--hint)]"
                  data-testid="account-save-profile"
                >
                  <Save size={18} />
                  {savingProfile ? 'Salvando...' : 'Salvar dados'}
                </button>
              </form>

              <form onSubmit={savePassword} className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
                  <KeyRound size={18} className="text-[var(--teal)]" />
                  Alterar senha
                </div>

                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-[var(--muted)]">
                    Senha atual
                  </span>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    required
                    className="aprova-field"
                    data-testid="account-current-password"
                  />
                </label>

                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-[var(--muted)]">Nova senha</span>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    required
                    minLength={8}
                    className="aprova-field"
                    data-testid="account-new-password"
                  />
                </label>

                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-[var(--muted)]">
                    Confirmar nova senha
                  </span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    minLength={8}
                    className="aprova-field"
                    data-testid="account-confirm-password"
                  />
                </label>

                {passwordError && (
                  <p className="rounded-[var(--radius-sm)] bg-[var(--danger-bg)] px-3 py-2 text-sm text-[var(--danger)]">
                    {passwordError}
                  </p>
                )}
                {passwordStatus && (
                  <p className="rounded-[var(--radius-sm)] bg-[var(--teal-light)] px-3 py-2 text-sm text-[var(--teal-ink)]">
                    {passwordStatus}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={savingPassword}
                  className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--ink)] px-4 py-3 font-semibold text-white transition hover:bg-[#273a34] disabled:bg-[var(--hint)]"
                  data-testid="account-save-password"
                >
                  <KeyRound size={18} />
                  {savingPassword ? 'Alterando...' : 'Alterar senha'}
                </button>
              </form>
            </div>

            {profile.isPayingOrExPaying && (
              <div className="flex flex-col gap-3 border-t border-[color:var(--line)] px-5 py-4">
                <Link
                  href="/history"
                  data-testid="account-history-link"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--ink)] px-4 py-3 font-semibold text-white transition hover:bg-[#273a34]"
                >
                  <History size={18} />
                  Ver Histórico de Questões
                </Link>
                <button
                  type="button"
                  onClick={cancelSubscription}
                  disabled={cancelingSubscription}
                  data-testid="account-cancel-subscription"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[color:var(--line-2)] bg-white px-4 py-3 font-semibold text-[var(--ink)] transition hover:text-[var(--teal)] disabled:text-[var(--hint)]"
                >
                  <CreditCard size={18} />
                  {cancelingSubscription
                    ? 'Cancelando...'
                    : 'Cancelar renovação da assinatura'}
                </button>
                {cancelError && (
                  <p className="rounded-[var(--radius-sm)] bg-[var(--danger-bg)] px-3 py-2 text-sm text-[var(--danger)]">
                    {cancelError}
                  </p>
                )}
                {cancelStatus && (
                  <p className="rounded-[var(--radius-sm)] bg-[var(--teal-light)] px-3 py-2 text-sm text-[var(--teal-ink)]">
                    {cancelStatus}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
