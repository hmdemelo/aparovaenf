import { test, expect } from '@playwright/test'

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

  // 2. Non-subscriber redirected to paywall (/assinar).
  await expect(page).toHaveURL(/\/assinar/, { timeout: 30_000 })
  await expect(page.getByTestId('paywall')).toBeVisible({ timeout: 15_000 })
})

