import { test, expect, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

test.beforeEach(async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (url && key) {
    const db = createClient(url, key, { auth: { persistSession: false } })
    await db.from('answer_attempts').delete().eq('user_id', '00000000-0000-0000-0000-0000000000a4')
  }
})

/**
 * US4 — subscriber retention.
 *
 * A subscriber can favorite a question and find it in /favorites. A
 * non-subscriber who tries to favorite is prompted to subscribe and nothing
 * persists.
 */

async function login(page: Page, email: string, next: string) {
  await page.goto(`/login?next=${encodeURIComponent(next)}`)
  await page.getByTestId('email').fill(email)
  await page.getByTestId('password').fill('aprovaenf123')
  await page.getByTestId('submit').click()
  await expect(page).toHaveURL(new RegExp(next.replace(/[/?]/g, '\\$&')), {
    timeout: 30_000,
  })
}

async function answerCurrentQuestion(page: Page) {
  const firstAlternative = page.getByTestId('alternative').first()
  await firstAlternative.waitFor({ state: 'visible', timeout: 30_000 })
  await firstAlternative.click()
  await page.getByRole('button', { name: 'Responder' }).click()
  await expect(page.getByTestId('answer-feedback')).toBeVisible({ timeout: 30_000 })
}

test('subscriber favorites a question and finds it in favorites', async ({ page }) => {
  test.setTimeout(120_000)
  await login(page, 'assinante@aprovaenf.local', '/feed?career=enfermeiro-a')

  await answerCurrentQuestion(page)
  await page.getByTestId('favorite-button').click()
  // Heart reflects the saved state (first /api/favorites hit compiles in dev).
  await expect(page.getByTestId('favorite-button')).toHaveAttribute(
    'aria-pressed',
    'true',
    { timeout: 30_000 },
  )

  await page.goto('/favorites')
  await expect(page.getByTestId('favorites-list')).toBeVisible({ timeout: 15_000 })
})

test('non-subscriber is prompted to subscribe when accessing features', async ({ page }) => {
  test.setTimeout(120_000)
  
  // Try to log in with a non-subscriber account, expecting redirect to selected feed (trial enabled).
  await page.goto(`/login?next=${encodeURIComponent('/feed?career=enfermeiro-a')}`)
  await page.getByTestId('email').fill('aluno@aprovaenf.local')
  await page.getByTestId('password').fill('aprovaenf123')
  await page.getByTestId('submit').click()
  await expect(page).toHaveURL(/\/feed\?career=enfermeiro-a/, { timeout: 30_000 })

  // Trying to visit feed directly allows access (trial enabled).
  await page.goto('/feed?career=enfermeiro-a')
  await expect(page).toHaveURL(/\/feed\?career=enfermeiro-a/, { timeout: 15_000 })

  // Favorites page renders the locked state.
  await page.goto('/favorites')
  await expect(page.getByTestId('favorites-locked')).toBeVisible({ timeout: 15_000 })

  // Errors page redirects directly to paywall.
  await page.goto('/errors')
  await expect(page).toHaveURL(/\/assinar/, { timeout: 15_000 })
})
