import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Termos de uso' }

export default function TermosPage() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Termos de uso</h1>
      <div className="flex flex-col gap-4 text-sm leading-relaxed text-slate-700">
        <p>
          O aprovaenf é uma plataforma de estudo por questões comentadas para
          concursos da área da saúde. Ao usar a plataforma, você concorda com
          estes termos.
        </p>
        <h2 className="text-base font-semibold text-slate-900">Conta e acesso</h2>
        <p>
          Você pode responder questões gratuitas antes do cadastro. Após o limite
          gratuito, é necessário assinar um plano para continuar.
        </p>
        <h2 className="text-base font-semibold text-slate-900">Conteúdo</h2>
        <p>
          As questões podem ser autorais ou de provas anteriores. Questões de
          provas oficiais mantêm a indicação de banca, cargo, ano e órgão quando
          disponíveis.
        </p>
        <h2 className="text-base font-semibold text-slate-900">Assinaturas</h2>
        <p>
          Os planos mensal e anual dão acesso ilimitado às questões, favoritos e
          histórico de erros. O pagamento é processado por provedor externo.
        </p>
        <p className="text-xs text-slate-600">
          Este é um texto inicial e poderá ser atualizado.
        </p>
      </div>
      <Link href="/" className="mt-8 inline-block text-sm text-emerald-700 underline">
        ← Voltar
      </Link>
    </main>
  )
}
