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
          No <strong>aprovaenf</strong>, valorizamos a transparência e a segurança dos seus dados. Esta política descreve como coletamos, usamos e protegemos suas informações de acordo com as leis vigentes, incluindo a Lei Geral de Proteção de Dados (LGPD).
        </p>

        <h2 className="text-base font-semibold text-[var(--ink)]">1. Informações Coletadas</h2>
        <ul className="list-disc pl-5 flex flex-col gap-2">
          <li>
            <strong>Dados de Cadastro:</strong> Nome completo, endereço de e-mail e credenciais de login geradas ao criar sua conta.
          </li>
          <li>
            <strong>Histórico de Estudo:</strong> Registro de questões respondidas, alternativas selecionadas, tempo de resposta, taxa de acerto/erro e questões favoritadas. Esses dados são essenciais para gerar suas métricas de desempenho e histórico de erros.
          </li>
          <li>
            <strong>Sessão de Visitante:</strong> Identificadores de sessão temporários armazenados localmente no seu dispositivo para controlar o limite de 2 questões gratuitas antes da criação da conta.
          </li>
        </ul>

        <h2 className="text-base font-semibold text-[var(--ink)]">2. Uso e Finalidade dos Dados</h2>
        <p>
          Utilizamos seus dados estritamente para:
        </p>
        <ul className="list-disc pl-5 flex flex-col gap-2">
          <li>Operar a plataforma de estudos, gerenciar seu trial de 5 questões e sua assinatura ativa.</li>
          <li>Fornecer a funcionalidade de histórico de erros e salvamento de questões favoritas.</li>
          <li>Disparar comunicações e-mails transacionais (como e-mail de boas-vindas, alertas de vencimento ou falhas de pagamento) através do provedor <strong>Resend</strong>.</li>
          <li>Garantir a segurança da plataforma e prevenir fraudes nos limites de acesso.</li>
        </ul>

        <h2 className="text-base font-semibold text-[var(--ink)]">3. Processamento de Pagamentos e Cartões</h2>
        <p>
          Para o processamento de assinaturas recorrentes (planos mensal e anual), utilizamos o gateway de pagamentos parceiro <strong>Stripe</strong>. 
          <strong> Os seus dados de cartão de crédito nunca transitam nem são armazenados em nossos servidores.</strong> Todo o processamento de pagamento ocorre em ambiente criptografado e seguro gerenciado pela própria Stripe.
        </p>

        <h2 className="text-base font-semibold text-[var(--ink)]">4. Compartilhamento e Armazenamento</h2>
        <p>
          Seus dados são armazenados de forma segura utilizando a infraestrutura do <strong>Supabase</strong>. Não comercializamos suas informações com terceiros em nenhuma hipótese. Os dados são compartilhados apenas com os parceiros operacionais indispensáveis citados nesta política (Supabase, Stripe e Resend).
        </p>

        <h2 className="text-base font-semibold text-[var(--ink)]">5. Seus Direitos (LGPD)</h2>
        <p>
          Como titular dos dados, você pode exercer seus direitos garantidos pela LGPD, tais como confirmar a existência do tratamento, acessar seus dados coletados, corrigir informações desatualizadas ou incompletas, e solicitar a exclusão definitiva de sua conta enviando uma solicitação ao nosso suporte.
        </p>
      </div>
      </section>
      <Link href="/" className="mt-8 inline-block text-sm font-semibold text-[var(--teal)] underline">
        ← Voltar
      </Link>
    </main>
  )
}
