import { ResetPasswordForm } from '@/features/auth/reset-password-form'
import { AprovaenfLogo } from '@/features/brand/aprovaenf-logo'

export default function RedefinirSenhaPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
      <div className="aprova-paper-card w-full max-w-md p-5 sm:p-7">
        <AprovaenfLogo className="mb-5 justify-center text-[var(--teal)]" />
        <h1 className="font-display mb-1 text-center text-[25px] font-semibold text-[var(--ink)]">
          Definir nova senha
        </h1>
        <p className="mb-6 text-center text-sm text-[var(--muted)]">
          Escolha uma nova senha para sua conta.
        </p>
        <ResetPasswordForm />
      </div>
    </main>
  )
}
