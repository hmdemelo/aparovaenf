import Link from 'next/link'
import type { Metadata } from 'next'
import { AprovaenfLogo } from '@/features/brand/aprovaenf-logo'

export const metadata: Metadata = { title: 'Política de privacidade' }

export default function PrivacidadePage() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-10">
      <Link href="/" aria-label="aprovaenf início">
        <AprovaenfLogo className="mb-8 text-[var(--teal)]" />
      </Link>
      <section className="aprova-paper-card p-6 sm:p-8">
        <h1 className="font-display mb-6 text-[28px] font-semibold text-[var(--ink)]">
          Política de privacidade
        </h1>
      <div className="flex flex-col gap-4 text-sm leading-relaxed text-[var(--muted)]">
        <p>
          Respeitamos a sua privacidade. Esta política descreve, de forma
          inicial, como os seus dados são tratados no aprovaenf.
        </p>
        <h2 className="text-base font-semibold text-[var(--ink)]">Dados coletados</h2>
        <p>
          Coletamos os dados de cadastro (nome e e-mail), o seu histórico de
          respostas e eventos de uso necessários para operar a plataforma e
          melhorar a experiência de estudo.
        </p>
        <h2 className="text-base font-semibold text-[var(--ink)]">Uso dos dados</h2>
        <p>
          Usamos os dados para liberar o acesso, registrar o seu progresso,
          processar assinaturas e entender o funil de uso do produto. Não
          vendemos seus dados.
        </p>
        <h2 className="text-base font-semibold text-[var(--ink)]">Segurança</h2>
        <p>
          O acesso aos dados é protegido por autenticação e por políticas de
          segurança no banco de dados. Pagamentos são processados por provedor
          externo especializado.
        </p>
        <p className="text-xs text-[var(--hint)]">
          Este é um texto inicial e poderá ser atualizado.
        </p>
      </div>
      </section>
      <Link href="/" className="mt-8 inline-block text-sm font-semibold text-[var(--teal)] underline">
        ← Voltar
      </Link>
    </main>
  )
}
