import Link from 'next/link'
import type { Metadata } from 'next'
import { AprovaenfLogo } from '@/features/brand/aprovaenf-logo'

export const metadata: Metadata = { title: 'Termos de uso' }

export default function TermosPage() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-10">
      <Link href="/" aria-label="aprovaenf início">
        <AprovaenfLogo className="mb-8 text-[var(--teal)]" />
      </Link>
      <section className="aprova-paper-card p-6 sm:p-8">
        <h1 className="font-display mb-6 text-[28px] font-semibold text-[var(--ink)]">
          Termos de uso
        </h1>
      <div className="flex flex-col gap-4 text-sm leading-relaxed text-[var(--muted)]">
        <p>
          O aprovaenf é uma plataforma de estudo por questões comentadas para
          concursos da área da saúde. Ao usar a plataforma, você concorda com
          estes termos.
        </p>
        <h2 className="text-base font-semibold text-[var(--ink)]">Conta e acesso</h2>
        <p>
          Você pode responder questões gratuitas antes do cadastro. Após o limite
          gratuito, é necessário assinar um plano para continuar.
        </p>
        <h2 className="text-base font-semibold text-[var(--ink)]">Conteúdo</h2>
        <p>
          As questões podem ser autorais ou de provas anteriores. Questões de
          provas oficiais mantêm a indicação de banca, cargo, ano e órgão quando
          disponíveis.
        </p>
        <h2 className="text-base font-semibold text-[var(--ink)]">Assinaturas</h2>
        <p>
          Os planos mensal e anual dão acesso ilimitado às questões, favoritos e
          histórico de erros. O pagamento é processado por provedor externo.
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
