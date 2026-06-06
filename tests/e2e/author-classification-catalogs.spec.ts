import { test, expect } from '@playwright/test'

test('author manages classifications (disciplines, subjects, boards) in catalog dialog', async ({
  page,
}) => {
  test.setTimeout(120_000)

  // Log in as the seeded author.
  await page.goto('/login?next=/author/questions')
  await page.getByTestId('email').fill('autor1@aprovaenf.local')
  await page.getByTestId('password').fill('aprovaenf123')
  await page.getByTestId('submit').click()

  await expect(page).toHaveURL(/\/author\/questions/, { timeout: 30_000 })

  // Start a new question.
  await page.getByTestId('new-question').click()
  await expect(page.getByTestId('question-editor')).toBeVisible({ timeout: 30_000 })

  // Open the catalog dialog for disciplines (first "Buscar" button)
  await page.locator('button:has-text("Buscar")').first().click()
  await expect(page.getByText('Gerenciar classificações')).toBeVisible()

  // Check tab clicks
  await page.getByRole('button', { name: 'Bancas' }).click()
  await page.getByRole('button', { name: 'Disciplinas' }).click()

  // Close the dialog
  await page.getByLabel('Fechar modal').click()
  await expect(page.getByText('Gerenciar classificações')).not.toBeVisible()
})
