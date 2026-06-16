import { ForgotPasswordForm } from '@/features/auth/forgot-password-form'
import { AprovaenfLogo } from '@/features/brand/aprovaenf-logo'

export default function RecuperarSenhaPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
      <div className="aprova-paper-card w-full max-w-md p-5 sm:p-7">
        <AprovaenfLogo className="mb-5 justify-center text-[var(--teal)]" />
        <h1 className="font-display mb-1 text-center text-[25px] font-semibold text-[var(--ink)]">
          Recuperar senha
        </h1>
        <p className="mb-6 text-center text-sm text-[var(--muted)]">
          Informe seu e-mail e enviaremos um link para redefinir sua senha.
        </p>
        <ForgotPasswordForm />
      </div>
    </main>
  )
}
