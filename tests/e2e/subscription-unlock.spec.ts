import { expect, test, type Page } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/db/database.types'
import { loadLocalEnv } from '../integration/helpers/local-env'

const hasLocalEnv = loadLocalEnv()
const asaasWebhookToken = process.env.ASAAS_WEBHOOK_TOKEN
const testUserPwd = 'aprovaenf123'

test.skip(
  !hasLocalEnv || !asaasWebhookToken,
  'Requires local Supabase env and the Asaas webhook token.',
)

async function login(page: Page, email: string, next: string) {
  await page.goto(`/login?next=${encodeURIComponent(next)}`)
  await page.getByTestId('email').fill(email)
  await page.getByTestId('password').fill(testUserPwd)
  await page.getByTestId('submit').click()
  await expect(page).toHaveURL(/\/assinar/, { timeout: 30_000 })
}


function serviceClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing local Supabase service env')
  return createClient<Database>(url, key, { auth: { persistSession: false } })
}

async function createTemporaryStudent(
  service: SupabaseClient<Database>,
  projectName: string,
) {
  const slug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const email = `pagamento-e2e-${slug}-${Date.now()}@aprovaenf.local`
  const { data, error } = await service.auth.admin.createUser({
    email,
    password: testUserPwd,
    email_confirm: true,
  })
  if (error || !data.user) {
    throw new Error(error?.message ?? 'Could not create temporary student')
  }

  const profile = await service.from('user_profiles').upsert({
    id: data.user.id,
    role: 'student',
    email,
    name: 'Aluno pagamento E2E',
    registration_completed: true,
  })
  if (profile.error) throw new Error(profile.error.message)

  return { email, userId: data.user.id }
}

test('paywall starts checkout and simulated webhook unlocks the feed', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Covered once to avoid payment state races.')
  test.setTimeout(150_000)

  const service = serviceClient()
  const student = await createTemporaryStudent(service, testInfo.project.name)
  const subscriptionId = crypto.randomUUID()

  try {
    await login(page, student.email, '/assinar')

    await expect(page.getByTestId('paywall')).toBeVisible({ timeout: 30_000 })

    let checkoutBody: unknown
    await page.route('**/api/billing/checkout', async (route) => {
      checkoutBody = route.request().postDataJSON()
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            checkout_id: 'checkout_e2e',
            checkout_url:
              'http://localhost:3000/?checkout=mock',
            subscription_id: subscriptionId,
            plan: 'annual',
            amount_cents: 28700,
          },
        }),
      })
    })

    await page.getByTestId('checkout-annual').click()
    await expect
      .poll(() => checkoutBody)
      .toMatchObject({ plan: 'annual' })
    await expect(page).toHaveURL(/checkout=mock/, { timeout: 30_000 })

    // A ativação Asaas correlaciona pelo externalReference com a linha local
    // pendente, então ela precisa existir antes do webhook.
    const pending = await service.from('subscriptions').insert({
      id: subscriptionId,
      user_id: student.userId,
      plan: 'annual',
      status: 'pending',
      provider: 'asaas',
    })
    if (pending.error) throw new Error(pending.error.message)

    const webhookPayload = {
      id: `evt_e2e_${Date.now()}`,
      event: 'PAYMENT_CONFIRMED',
      payment: {
        id: `pay_e2e_${Date.now()}`,
        customer: 'cus_e2e_' + student.userId,
        subscription: 'sub_e2e_12345',
        billingType: 'CREDIT_CARD',
        externalReference: subscriptionId,
        value: 287,
      },
    }
    const webhookResponse = await page.request.post(`/api/webhooks/asaas`, {
      headers: {
        'content-type': 'application/json',
        'asaas-access-token': asaasWebhookToken!,
      },
      data: JSON.stringify(webhookPayload),
    })
    expect(webhookResponse.status()).toBe(200)
    const webhookJson = await webhookResponse.json()
    expect(webhookJson.data?.activated).toBe(true)

    await page.goto('/feed?career=enfermeiro-a')
    await expect(page.getByTestId('paywall')).toBeHidden({ timeout: 30_000 })
    await expect(page.getByTestId('alternative').first()).toBeVisible({
      timeout: 30_000,
    })
  } finally {
    await service.auth.admin.deleteUser(student.userId)
  }
})
