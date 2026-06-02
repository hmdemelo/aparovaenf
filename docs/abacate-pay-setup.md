# Configuração Abacate Pay

Este guia configura a integração de pagamentos do aprovaenf com a API v2 da
Abacate Pay.

## Modelo de planos

- Plano mensal: produto de assinatura com `cycle: MONTHLY`, preço `2990`.
- Plano anual: produto avulso sem `cycle`, preço `28700`, checkout com cartão em
  até 12x.

O anual é avulso porque a Abacate Pay não suporta parcelamento em assinaturas.
Quando o webhook `checkout.completed` chega, o aprovaenf libera 12 meses de
acesso no banco.

## Variáveis necessárias

Configure em `.env.local` e depois na Vercel:

```bash
ABACATE_PAY_API_KEY=
ABACATE_PAY_WEBHOOK_SECRET=
ABACATE_PAY_WEBHOOK_PUBLIC_KEY=
ABACATE_PAY_MONTHLY_PRODUCT_ID=
ABACATE_PAY_ANNUAL_PRODUCT_ID=
NEXT_PUBLIC_APP_URL=
```

`ABACATE_PAY_WEBHOOK_PUBLIC_KEY` é a chave pública HMAC documentada pela
Abacate Pay para validar `X-Webhook-Signature`.

## Provisionamento seguro

O comando abaixo roda em dry-run e não cria nada:

```bash
npm run abacate:setup
```

Para criar produtos e webhook ausentes na Abacate Pay, rode somente depois de
confirmar que a chave está no ambiente correto:

```bash
npm run abacate:setup -- --apply
```

O script imprime os IDs para copiar para `.env.local` e para as variáveis da
Vercel. Ele não grava `.env.local` automaticamente para evitar tocar em segredos.

## Webhook

Endpoint de produção:

```text
https://SEU_DOMINIO/api/webhooks/abacate-pay
```

Eventos configurados:

- `checkout.completed`
- `subscription.completed`
- `subscription.renewed`
- `subscription.cancelled`

A rota valida:

- query string `webhookSecret`
- header `X-Webhook-Signature`
- idempotência por `provider_event_id`

## Testes locais

Depois de configurar as variáveis:

```bash
npm run test:integration
npm run build
```

Para testar checkout real, use uma URL pública HTTPS no `NEXT_PUBLIC_APP_URL`.
`localhost` não serve para webhook da Abacate Pay.
