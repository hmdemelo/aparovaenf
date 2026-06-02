import { test, expect, type Page } from '@playwright/test'

/**
 * US5 — admin moderation.
 *
 * An admin logs in, opens the dashboard, and unpublishes a published question;
 * the row then shows as no longer published.
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

test('admin unpublishes a published question from the dashboard', async ({ page }) => {
  test.setTimeout(120_000)
  await login(page, 'admin@aprovaenf.local', '/admin')

  await expect(page.getByTestId('admin-questions')).toBeVisible({ timeout: 30_000 })

  // Grab the first available unpublish button (a published question).
  const unpublish = page.locator('[data-testid^="unpublish-"]').first()
  await expect(unpublish).toBeVisible({ timeout: 15_000 })

  // Derive the question id from the testid so we can assert on its row.
  const testId = await unpublish.getAttribute('data-testid')
  const questionId = testId!.replace('unpublish-', '')

  const countBefore = await page.locator('[data-testid^="unpublish-"]').count()
  await unpublish.click()

  // After refresh, that question's unpublish button is gone (it is no longer
  // published) and the total number of published questions dropped.
  await expect(page.getByTestId(`unpublish-${questionId}`)).toHaveCount(0, {
    timeout: 30_000,
  })
  const countAfter = await page.locator('[data-testid^="unpublish-"]').count()
  expect(countAfter).toBe(countBefore - 1)
})
