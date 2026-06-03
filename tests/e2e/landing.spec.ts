import { test, expect } from '@playwright/test'

/**
 * US6 — public landing converts visitors.
 *
 * The visitor understands the offer, picks a career, and reaches the first
 * question without signing up first.
 */

test('landing presents the offer and starts the feed from a career', async ({
  page,
}) => {
  test.setTimeout(90_000)
  await page.goto('/')

  // First viewport communicates the product.
  await expect(
    page.getByRole('heading', {
      name: /Questões comentadas para concursos da saúde/i,
    }),
  ).toBeVisible()

  // Pricing is present with the confirmed prices.
  await expect(page.getByText('R$ 29,90')).toBeVisible()
  await expect(page.getByText('R$ 287,00')).toBeVisible()

  // Choosing a career redirects to the signup wall.
  const career = page.getByTestId('career-enfermeiro-a')
  await career.waitFor({ state: 'visible', timeout: 30_000 })
  await career.click()

  await expect(page).toHaveURL(/\/signup\?next=%2Ffeed%3Fcareer%3Denfermeiro-a/, { timeout: 30_000 })
  await expect(page.getByTestId('signup-form')).toBeVisible({
    timeout: 30_000,
  })
})

test('terms and privacy pages are reachable from the footer', async ({ page }) => {
  test.setTimeout(60_000)
  await page.goto('/')
  await page.getByRole('link', { name: 'Termos de uso' }).click()
  await expect(page).toHaveURL(/\/termos/, { timeout: 15_000 })
  await expect(page.getByRole('heading', { name: 'Termos de uso' })).toBeVisible()
})
