import 'server-only'

export type EmailTemplateResult = {
  subject: string
  html: string
  text: string
}

type BaseEmailProps = {
  title: string
  previewText: string
  contentHtml: string
}

function renderBaseEmail({ title, previewText, contentHtml }: BaseEmailProps): string {
  const currentYear = new Date().getFullYear()
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, a { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
  <style>
    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
      background-color: #f7f5f0;
      color: #0e1f1a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    img {
      border: 0;
      outline: none;
      text-decoration: none;
    }
    a {
      color: #005440;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f7f5f0;
      padding-top: 40px;
      padding-bottom: 40px;
    }
    .main-table {
      background-color: #ffffff;
      margin: 0 auto;
      width: 100%;
      max-width: 600px;
      border-collapse: separate;
      border: 1px solid rgba(20, 43, 38, 0.08);
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(20, 43, 38, 0.03);
      overflow: hidden;
    }
    .header {
      background-color: #eafef6;
      padding: 32px 40px;
      text-align: center;
      border-bottom: 1px solid rgba(20, 43, 38, 0.06);
    }
    .logo-text {
      font-size: 26px;
      font-weight: bold;
      color: #0e1f1a;
      letter-spacing: -0.5px;
    }
    .logo-highlight {
      color: #0f6e56;
    }
    .content {
      padding: 40px;
      font-size: 16px;
      line-height: 1.6;
      color: #0e1f1a;
    }
    .button-container {
      margin: 32px 0;
      text-align: center;
    }
    .button {
      display: inline-block;
      background-color: #005440;
      color: #ffffff !important;
      padding: 14px 28px;
      font-weight: bold;
      border-radius: 10px;
      text-decoration: none;
      text-align: center;
    }
    .button:hover {
      background-color: #0c5b47;
      text-decoration: none;
    }
    .footer {
      padding: 32px 40px;
      text-align: center;
      font-size: 13px;
      color: #5d6b65;
      border-top: 1px solid rgba(20, 43, 38, 0.06);
      background-color: #fcfbfa;
    }
    @media only screen and (max-width: 600px) {
      .main-table {
        border-radius: 0 !important;
        border-left: 0 !important;
        border-right: 0 !important;
      }
      .content {
        padding: 30px 20px !important;
      }
      .header, .footer {
        padding: 24px 20px !important;
      }
    }
  </style>
</head>
<body>
  <span style="display:none !important; visibility:hidden; mso-hide:all; font-size:1px; line-height:1px; max-height:0px; max-width:0px; opacity:0; overflow:hidden;">
    ${previewText}
  </span>

  <center class="wrapper">
    <table class="main-table" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td class="header">
          <div class="logo-text">
            aprova<span class="logo-highlight">enf</span>
          </div>
        </td>
      </tr>
      <tr>
        <td class="content">
          ${contentHtml}
        </td>
      </tr>
      <tr>
        <td class="footer">
          <p style="margin: 0 0 10px 0;">Este é um e-mail transacional enviado automaticamente pelo <strong>AprovaENF</strong>.</p>
          <p style="margin: 0 0 10px 0;">Se precisar de ajuda, entre em contato através do e-mail <a href="mailto:suporte@aprovaenf.com" style="color: #0f6e56; font-weight: 500;">suporte@aprovaenf.com</a></p>
          <p style="margin: 20px 0 0 0; font-size: 11px; color: #9aa8a2;">&copy; ${currentYear} AprovaENF. Todos os direitos reservados.</p>
        </td>
      </tr>
    </table>
  </center>
</body>
</html>`
}

/**
 * Generates the Welcome/Activation email for new subscribers.
 */
export function renderWelcomeEmail(name: string, planName: string, appUrl: string): EmailTemplateResult {
  const subject = 'Seu acesso ao AprovaENF Pro está liberado! 🎉'
  const previewText = 'Prepare-se para conquistar sua vaga na enfermagem com o Pro.'
  const feedUrl = `${appUrl}/feed`

  const contentHtml = `
    <h1 style="font-size: 22px; font-weight: bold; margin-top: 0; margin-bottom: 20px; color: #005440;">Seu acesso Pro está pronto!</h1>
    <p>Olá, <strong>${name}</strong>,</p>
    <p>Seu pagamento foi confirmado com sucesso e a sua assinatura do plano <strong>${planName}</strong> do <strong>AprovaENF Pro</strong> já está ativa! 🎉</p>
    <p>Agora você tem acesso irrestrito a todas as funcionalidades premium para acelerar a sua aprovação:</p>
    <ul style="padding-left: 20px; margin-bottom: 24px;">
      <li style="margin-bottom: 8px;"><strong>Feed de Questões Infinito:</strong> Sem limite diário de respostas. Estude o quanto quiser!</li>
      <li style="margin-bottom: 8px;"><strong>Histórico e Favoritos:</strong> Salve as questões cruciais e revise seus erros de forma inteligente.</li>
      <li style="margin-bottom: 8px;"><strong>Explicações Completas:</strong> Veja comentários detalhados e focados feitos por especialistas da área.</li>
    </ul>
    <p>Clique no botão abaixo para começar a responder questões agora mesmo:</p>
    <div class="button-container">
      <a href="${feedUrl}" class="button">Começar a Estudar</a>
    </div>
    <p style="font-size: 14px; color: #5d6b65; margin-top: 24px;">Caso o botão não funcione, você também pode copiar e colar o link a seguir no seu navegador: <br><a href="${feedUrl}" style="color: #0f6e56;">${feedUrl}</a></p>
  `

  const text = `Olá, ${name}!

Seu acesso ao AprovaENF Pro está liberado!

Seu pagamento foi confirmado com sucesso e a sua assinatura do plano ${planName} já está ativa.

O que você tem acesso agora:
- Feed de Questões Infinito (sem limite diário)
- Histórico e Favoritos completos
- Comentários detalhados de especialistas

Comece a estudar agora acessando: ${feedUrl}

Bons estudos!
Equipe AprovaENF`

  return {
    subject,
    html: renderBaseEmail({ title: subject, previewText, contentHtml }),
    text,
  }
}

/**
 * Generates the Past Due / Payment Failed notification.
 */
export function renderPaymentFailedEmail(name: string, billingUrl: string): EmailTemplateResult {
  const subject = 'Ops, tivemos um problema com seu pagamento no AprovaENF Pro ⚠️'
  const previewText = 'Ação necessária: Atualize seus dados de cobrança para manter o acesso.'

  const contentHtml = `
    <h1 style="font-size: 22px; font-weight: bold; margin-top: 0; margin-bottom: 20px; color: #b23a2e;">Tivemos um problema com a cobrança</h1>
    <p>Olá, <strong>${name}</strong>,</p>
    <p>Não conseguimos processar o pagamento da renovação da sua assinatura do <strong>AprovaENF Pro</strong> no seu cartão cadastrado.</p>
    <p><strong>Não se preocupe:</strong> seu acesso continuará ativo temporariamente por alguns dias enquanto tentamos regularizar a cobrança.</p>
    <p>Para evitar qualquer bloqueio e garantir que seu histórico de erros e questões favoritadas continue disponível, por favor, atualize os seus dados de pagamento clicando no botão abaixo:</p>
    <div class="button-container">
      <a href="${billingUrl}" class="button" style="background-color: #b23a2e;">Atualizar Dados de Cobrança</a>
    </div>
    <p>Se você tiver alguma dúvida ou encontrar dificuldades, responda a este e-mail para que nosso suporte possa te ajudar.</p>
  `

  const text = `Olá, ${name},

Não conseguimos processar o pagamento da renovação da sua assinatura do AprovaENF Pro.

Seu acesso continua ativo por alguns dias enquanto tentamos regularizar a cobrança. Para atualizar seus dados de cobrança e evitar interrupções nos seus estudos, por favor acesse o link abaixo:

${billingUrl}

Se tiver dúvidas, responda a este e-mail.
Equipe AprovaENF`

  return {
    subject,
    html: renderBaseEmail({ title: subject, previewText, contentHtml }),
    text,
  }
}

/**
 * Generates the Subscription Canceled / Expired email.
 */
export function renderSubscriptionExpiredEmail(name: string, appUrl: string): EmailTemplateResult {
  const subject = 'Sua assinatura do AprovaENF Pro foi encerrada'
  const previewText = 'Sentiremos sua falta! Seu plano voltou para a versão gratuita.'
  const pricingUrl = `${appUrl}/assinar`

  const contentHtml = `
    <h1 style="font-size: 22px; font-weight: bold; margin-top: 0; margin-bottom: 20px; color: #0e1f1a;">Assinatura Pro Encerrada</h1>
    <p>Olá, <strong>${name}</strong>,</p>
    <p>Confirmamos o encerramento da sua assinatura do <strong>AprovaENF Pro</strong>.</p>
    <p>O seu perfil voltou para o plano gratuito da plataforma. A partir de agora:</p>
    <ul style="padding-left: 20px; margin-bottom: 24px;">
      <li style="margin-bottom: 8px;">Suas respostas diárias estão limitadas a 5 questões por dia.</li>
      <li style="margin-bottom: 8px;">Os recursos de Favoritos e histórico de erros foram desativados. Mas não se preocupe: seus dados salvos não foram deletados, eles apenas ficarão pausados caso você decida retornar.</li>
    </ul>
    <p>Caso tenha sido um engano ou queira reativar sua assinatura e voltar a estudar sem limites, basta clicar no botão abaixo:</p>
    <div class="button-container">
      <a href="${pricingUrl}" class="button">Assinar Novamente</a>
    </div>
    <p>Agradecemos o tempo que passou conosco e desejamos muito sucesso em sua jornada de estudos!</p>
  `

  const text = `Olá, ${name},

Confirmamos o encerramento da sua assinatura do AprovaENF Pro.

Seu perfil voltou para o plano gratuito, com limite de 5 questões diárias e os recursos de Favoritos/histórico pausados. Seus dados antigos estão guardados com segurança caso decida voltar.

Para assinar novamente, acesse: ${pricingUrl}

Muito obrigado e bons estudos!
Equipe AprovaENF`

  return {
    subject,
    html: renderBaseEmail({ title: subject, previewText, contentHtml }),
    text,
  }
}
