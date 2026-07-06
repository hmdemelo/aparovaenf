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
          O <strong>aprovaenf</strong> é uma plataforma web responsiva de estudos com foco em questões comentadas para concursos públicos da área de saúde (enfermagem e técnicos em enfermagem). Ao acessar e utilizar o nosso serviço, você concorda em cumprir e vincular-se aos seguintes termos.
        </p>

        <h2 className="text-base font-semibold text-[var(--ink)]">1. Teste Gratuito (Trial) e Cadastro</h2>
        <ul className="list-disc pl-5 flex flex-col gap-2">
          <li><strong>Visitantes Anônimos:</strong> Podem responder até 2 questões gratuitamente na página inicial sem necessidade de cadastro.</li>
          <li><strong>Usuários Cadastrados:</strong> Após as 2 primeiras questões, é necessário criar uma conta gratuita para responder mais 3 questões adicionais (totalizando o limite de 5 questões gratuitas no trial).</li>
          <li><strong>Bloqueio de Acesso:</strong> Ao atingir o limite de 5 questões respondidas no trial, o feed de questões será bloqueado e o usuário perderá o acesso às questões resolvidas e ao histórico até que adquira uma assinatura ativa.</li>
        </ul>

        <h2 className="text-base font-semibold text-[var(--ink)]">2. Planos e Assinaturas (Asaas)</h2>
        <p>
          Para obter acesso ilimitado ao banco de questões, histórico de erros e sistema de favoritos, oferecemos duas modalidades de assinatura recorrente: <strong>Mensal (R$ 29,90/mês)</strong> e <strong>Anual (R$ 287,00/ano)</strong>.
        </p>
        <ul className="list-disc pl-5 flex flex-col gap-2">
          <li><strong>Forma de Pagamento:</strong> O faturamento é realizado exclusivamente via cartão de crédito recorrente. Outras formas de pagamento (como PIX ou parcelamento no boleto) não são comercializadas neste fluxo.</li>
          <li><strong>Renovação Automática:</strong> As assinaturas são renovadas automaticamente ao final de cada período de faturamento, a menos que o cancelamento seja solicitado pelo usuário antes da data de renovação.</li>
          <li><strong>Cancelamento:</strong> O cancelamento cessa a renovação automática para o ciclo seguinte. O acesso do aluno permanecerá ativo até o final do período de faturamento já pago.</li>
        </ul>

        <h2 className="text-base font-semibold text-[var(--ink)]">3. Conteúdo das Questões e Propriedade Intelectual</h2>
        <ul className="list-disc pl-5 flex flex-col gap-2">
          <li><strong>Autoria e Comentários:</strong> As questões podem ser autorais (elaboradas por nossos especialistas parceiros) ou oriundas de provas anteriores de concursos oficiais. Todos os comentários de especialistas são protegidos por direitos autorais pertencentes aos respectivos autores e ao aprovaenf.</li>
          <li><strong>Dados de Concursos Oficiais:</strong> As questões de concursos mantêm a indicação do órgão, cargo, banca e ano correspondentes quando essas informações estiverem disponíveis na base pública original.</li>
        </ul>

        <h2 className="text-base font-semibold text-[var(--ink)]">4. Isenção de Responsabilidade</h2>
        <p>
          O aprovaenf é uma ferramenta educacional de suporte à preparação para concursos públicos. Nós nos esforçamos para fornecer comentários precisos e atualizados, contudo:
          <strong> Não garantimos a aprovação ou classificação do aluno em nenhum concurso público, nem nos responsabilizamos por alterações tardias em gabaritos oficiais promovidos por bancas organizadoras.</strong>
        </p>
      </div>
      </section>
      <Link href="/" className="mt-8 inline-block text-sm font-semibold text-[var(--teal)] underline">
        ← Voltar
      </Link>
    </main>
  )
}
