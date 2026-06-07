# Configuração Stripe

Este guia cobre a configuração operacional do checkout atual do aprovaenf.
O fluxo implementado usa assinaturas recorrentes da Stripe pagas com cartão.

## Modelo atual

- Mensal: assinatura recorrente de R$ 29,90.
- Anual: assinatura recorrente de R$ 287,00.
- PIX: não habilitado. A Stripe não oferece PIX recorrente; um plano anual com
  PIX precisa ser uma compra avulsa que libere 12 meses de acesso.
- Parcelamento: não anunciado nem configurado no checkout atual.

## Variáveis

Configure na Vercel para o ambiente de produção:

```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_ANNUAL_PRICE_ID=price_...
NEXT_PUBLIC_APP_URL=https://SEU_DOMINIO
```

O servidor rejeita o boot de produção se receber chave mock/teste, IDs de preço
ausentes ou uma URL pública sem HTTPS.

## Produtos e preços

No Stripe Dashboard em modo live:

1. Crie o produto mensal com preço recorrente BRL de R$ 29,90 por mês.
2. Crie o produto anual com preço recorrente BRL de R$ 287,00 por ano.
3. Copie os dois IDs `price_*` para as variáveis de produção.

## Webhook

Endpoint:

```text
https://SEU_DOMINIO/api/webhooks/stripe
```

Eventos:

- `checkout.session.completed`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.deleted`

A rota exige `Stripe-Signature` em todos os ambientes. Use o signing secret
específico do endpoint, não uma chave de API.

## Validação antes do lançamento

1. Rode checkout completo em Stripe test mode.
2. Confirme nos logs que o webhook foi validado e persistido com provider
   `stripe`.
3. Confirme que `checkout.session.completed` ativa a assinatura.
4. Confirme que `invoice.payment_failed` muda o estado local para `past_due`.
5. Confirme que um `invoice.paid` posterior restaura o estado `active`.
6. Confirme que `customer.subscription.deleted` revoga o acesso.
7. Repita um evento e confirme que a idempotência impede processamento duplo.

Não execute testes destrutivos com usuários ou assinaturas reais de produção.
