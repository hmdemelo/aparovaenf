import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Política de privacidade' }

export default function PrivacidadePage() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">
        Política de privacidade
      </h1>
      <div className="flex flex-col gap-4 text-sm leading-relaxed text-slate-700">
        <p>
          Respeitamos a sua privacidade. Esta política descreve, de forma
          inicial, como os seus dados são tratados no aprovaenf.
        </p>
        <h2 className="text-base font-semibold text-slate-900">Dados coletados</h2>
        <p>
          Coletamos os dados de cadastro (nome e e-mail), o seu histórico de
          respostas e eventos de uso necessários para operar a plataforma e
          melhorar a experiência de estudo.
        </p>
        <h2 className="text-base font-semibold text-slate-900">Uso dos dados</h2>
        <p>
          Usamos os dados para liberar o acesso, registrar o seu progresso,
          processar assinaturas e entender o funil de uso do produto. Não
          vendemos seus dados.
        </p>
        <h2 className="text-base font-semibold text-slate-900">Segurança</h2>
        <p>
          O acesso aos dados é protegido por autenticação e por políticas de
          segurança no banco de dados. Pagamentos são processados por provedor
          externo especializado.
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
