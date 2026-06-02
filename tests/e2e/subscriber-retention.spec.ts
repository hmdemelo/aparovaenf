import { test, expect, type Page } from '@playwright/test'

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

test('non-subscriber is prompted to subscribe when favoriting', async ({ page }) => {
  test.setTimeout(120_000)
  await login(page, 'aluno@aprovaenf.local', '/feed?career=enfermeiro-a')

  await answerCurrentQuestion(page)
  await page.getByTestId('favorite-button').click()

  await expect(page.getByTestId('favorite-message')).toContainText('Assine', {
    timeout: 15_000,
  })

  // Favorites stay locked for non-subscribers.
  await page.goto('/favorites')
  await expect(page.getByTestId('favorites-locked')).toBeVisible({ timeout: 15_000 })
})
