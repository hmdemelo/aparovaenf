#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const API_BASE_URL = 'https://api.abacatepay.com/v2'
const PUBLIC_WEBHOOK_HMAC_KEY =
  't9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9'

const args = new Set(process.argv.slice(2))
const apply = args.has('--apply')

const env = {
  ...process.env,
  ...readDotEnv(resolve(process.cwd(), '.env.local')),
}

const products = [
  {
    key: 'ABACATE_PAY_MONTHLY_PRODUCT_ID',
    externalId: 'aprovaenf-monthly',
    name: 'aprovaenf Mensal',
    description: 'Plano mensal do aprovaenf.',
    price: 2990,
    cycle: 'MONTHLY',
  },
  {
    key: 'ABACATE_PAY_ANNUAL_PRODUCT_ID',
    externalId: 'aprovaenf-annual',
    name: 'aprovaenf Anual',
    description: 'Plano anual do aprovaenf com acesso por 12 meses.',
    price: 28700,
    cycle: null,
  },
]

main().catch((error) => {
  console.error(`\nErro: ${error.message}`)
  process.exit(1)
})

async function main() {
  const apiKey = requireEnv('ABACATE_PAY_API_KEY')
  const appUrl = optionalEnv('NEXT_PUBLIC_APP_URL')
  const webhookSecret = optionalEnv('ABACATE_PAY_WEBHOOK_SECRET')

  console.log(apply ? 'Modo apply: criando recursos ausentes.' : 'Modo dry-run: nenhuma alteração remota será feita.')
  console.log('')

  const productResults = []
  for (const product of products) {
    productResults.push(await ensureProduct(apiKey, product))
  }

  const webhook = await ensureWebhook(apiKey, appUrl, webhookSecret)

  console.log('\nValores para ambiente local/Vercel:')
  for (const result of productResults) {
    console.log(`${result.key}=${result.id}`)
  }
  console.log(`ABACATE_PAY_WEBHOOK_PUBLIC_KEY=${PUBLIC_WEBHOOK_HMAC_KEY}`)
  if (webhook) {
    console.log(`ABACATE_PAY_WEBHOOK_URL=${webhook.endpoint}`)
  }

  console.log('\nObservações:')
  console.log('- Mensal usa produto com cycle MONTHLY e endpoint /subscriptions/create.')
  console.log('- Anual usa produto avulso e endpoint /checkouts/create com card.maxInstallments=12.')
  console.log('- O script não grava .env.local automaticamente para não tocar em segredos.')
}

async function ensureProduct(apiKey, product) {
  const existingId = optionalEnv(product.key)
  if (existingId) {
    console.log(`Produto ${product.externalId}: já configurado em ${product.key}.`)
    return { key: product.key, id: existingId }
  }

  const listed = await request(apiKey, `/products/list?externalId=${encodeURIComponent(product.externalId)}`)
  const existing = Array.isArray(listed.data)
    ? listed.data.find((item) => item.externalId === product.externalId)
    : null
  if (existing?.id) {
    console.log(`Produto ${product.externalId}: encontrado (${existing.id}).`)
    return { key: product.key, id: existing.id }
  }

  if (!apply) {
    console.log(`Produto ${product.externalId}: seria criado (${formatProduct(product)}).`)
    return { key: product.key, id: `<criado-com---apply:${product.externalId}>` }
  }

  const created = await request(apiKey, '/products/create', {
    externalId: product.externalId,
    name: product.name,
    description: product.description,
    price: product.price,
    currency: 'BRL',
    ...(product.cycle ? { cycle: product.cycle } : {}),
  })
  if (!created.data?.id) {
    throw new Error(`Produto ${product.externalId} foi criado sem id na resposta.`)
  }
  console.log(`Produto ${product.externalId}: criado (${created.data.id}).`)
  return { key: product.key, id: created.data.id }
}

async function ensureWebhook(apiKey, appUrl, webhookSecret) {
  if (!appUrl || !webhookSecret) {
    console.log('Webhook: pulado porque NEXT_PUBLIC_APP_URL ou ABACATE_PAY_WEBHOOK_SECRET não está configurado.')
    return null
  }

  const endpoint = `${withoutTrailingSlash(appUrl)}/api/webhooks/abacate-pay`
  if (!endpoint.startsWith('https://')) {
    console.log(`Webhook: pulado porque a Abacate exige endpoint HTTPS público (${endpoint}).`)
    return null
  }

  const listed = await request(apiKey, `/webhooks/list?search=${encodeURIComponent(endpoint)}`)
  const existing = Array.isArray(listed.data)
    ? listed.data.find((item) => item.endpoint === endpoint)
    : null
  if (existing?.id) {
    console.log(`Webhook: encontrado (${existing.id}).`)
    return { id: existing.id, endpoint }
  }

  if (!apply) {
    console.log(`Webhook: seria criado para ${endpoint}.`)
    return { id: '<criado-com---apply>', endpoint }
  }

  const created = await request(apiKey, '/webhooks/create', {
    name: 'aprovaenf pagamentos',
    endpoint,
    secret: webhookSecret,
    events: [
      'checkout.completed',
      'subscription.completed',
      'subscription.renewed',
      'subscription.cancelled',
    ],
  })
  if (!created.data?.id) {
    throw new Error('Webhook foi criado sem id na resposta.')
  }
  console.log(`Webhook: criado (${created.data.id}).`)
  return { id: created.data.id, endpoint }
}

async function request(apiKey, path, body) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

  const payload = await response.json().catch(() => null)
  if (!response.ok || payload?.success !== true) {
    const message =
      typeof payload?.error === 'string'
        ? payload.error
        : JSON.stringify(payload?.error ?? payload)
    throw new Error(`AbacatePay ${path} retornou ${response.status}: ${message}`)
  }
  return payload
}

function readDotEnv(path) {
  if (!existsSync(path)) return {}
  const values = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const separator = trimmed.indexOf('=')
    if (separator === -1) continue
    const key = trimmed.slice(0, separator).trim()
    const value = trimmed.slice(separator + 1).trim()
    if (key) values[key] = value
  }
  return values
}

function requireEnv(key) {
  const value = optionalEnv(key)
  if (!value) throw new Error(`${key} não está configurado.`)
  return value
}

function optionalEnv(key) {
  const value = env[key]
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function withoutTrailingSlash(value) {
  return value.replace(/\/+$/, '')
}

function formatProduct(product) {
  return `${product.price} centavos${product.cycle ? `, cycle ${product.cycle}` : ', avulso'}`
}
