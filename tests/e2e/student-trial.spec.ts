import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { loadLocalEnv } from '../integration/helpers/local-env'

loadLocalEnv()

test.beforeEach(async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (url && key) {
    const db = createClient(url, key, { auth: { persistSession: false } })
    await db.from('answer_attempts').delete().eq('user_id', '00000000-0000-0000-0000-0000000000a4')
  }
})

test('visitor is redirected to signup and non-subscriber to paywall', async ({ page }) => {
  test.setTimeout(90_000)
  await page.goto('/')

  // Choose Enfermagem and start the feed.
  const careerButton = page.getByTestId('career-enfermeiro-a')
  await careerButton.waitFor({ state: 'visible', timeout: 30_000 })
  await careerButton.click()
  
  // 1. Visitor redirected immediately to signup.
  await expect(page).toHaveURL(/\/signup\?next=%2Ffeed%3Fcareer%3Denfermeiro-a/, { timeout: 30_000 })
  await expect(page.getByTestId('signup-form')).toBeVisible({ timeout: 15_000 })

  // Go to login.
  await page.getByRole('link', { name: 'Já tenho conta' }).click()
  await expect(page).toHaveURL(/\/login\?next=%2Ffeed%3Fcareer%3Denfermeiro-a/, { timeout: 15_000 })

  // Log in as non-subscriber.
  await page.getByTestId('email').fill('aluno@aprovaenf.local')
  await page.getByTestId('password').fill('aprovaenf123')
  await page.getByTestId('submit').click()

  // 2. Non-subscriber lands on the feed.
  await expect(page).toHaveURL(/\/feed\?career=enfermeiro-a/, { timeout: 30_000 })

  // Answer 3 questions to consume the trial.
  for (let i = 0; i < 3; i++) {
    const alternative = page.getByTestId('alternative').first()
    await alternative.waitFor({ state: 'visible', timeout: 30_000 })
    await expect(alternative).toBeEnabled({ timeout: 15_000 })
    await alternative.click()
    await page.getByRole('button', { name: 'Responder' }).click()
    await page.getByTestId('next-question').click()
  }

  // 3. Non-subscriber is redirected to paywall (/assinar) when the trial limit is reached.
  await expect(page).toHaveURL(/\/assinar/, { timeout: 30_000 })
  await expect(page.getByTestId('paywall')).toBeVisible({ timeout: 15_000 })
})

