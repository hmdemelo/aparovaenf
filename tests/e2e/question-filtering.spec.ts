import { test, expect } from '@playwright/test'

/**
 * US2 — inline board registration + dynamic tagging.
 *
 * Logs in as the seeded author, creates a question, searches for a board that
 * does not exist yet, registers it inline with the "+" button (which auto-selects
 * it), adds dynamic tags, and publishes the question.
 */

test('author registers a board inline and tags a question', async ({ page }) => {
  test.setTimeout(120_000)

  // Unique board name so the search never matches an existing board and the
  // inline "+" button is offered.
  const boardName = `Instituto Hugo ${Date.now()}`

  await page.goto('/login?next=/author/questions')
  await page.getByTestId('email').fill('autor1@aprovaenf.local')
  await page.getByTestId('password').fill('aprovaenf123')
  await page.getByTestId('submit').click()
  await expect(page).toHaveURL(/\/author\/questions/, { timeout: 30_000 })

  await page.getByTestId('new-question').click()
  await expect(page.getByTestId('question-editor')).toBeVisible({ timeout: 30_000 })

  // Classification + content.
  await page.getByTestId('discipline-catalog').click()
  const disciplineResults = page
    .getByTestId('catalog-items-list')
    .getByRole('button', { name: 'Selecionar' })
  await expect(disciplineResults.first()).toBeVisible()
  await disciplineResults.first().click()
  await page.getByTestId('statement').fill('Questão E2E com banca inline e tags?')
  await page.getByTestId('alt-text-0').fill('Alternativa incorreta')
  await page.getByTestId('alt-text-1').fill('Alternativa correta')
  await page.getByTestId('correct-1').check()
  await page.getByTestId('general-comment').fill('Comentário geral da questão E2E.')

  // Register and auto-select a board through the shared catalog.
  await page.getByTestId('board-catalog').click()
  await page.getByTestId('catalog-search').fill(boardName)
  await page.getByTestId('catalog-create-toggle').click()
  await page.getByTestId('catalog-create-name').fill(boardName)
  await page.getByTestId('catalog-create-submit').click()
  await expect(page.getByTestId('board-value')).toContainText(boardName, {
    timeout: 30_000,
  })

  // Create an assunto under the selected discipline and confirm the selection.
  const topicName = `biosseguranca-e2e-${Date.now()}`
  await page.getByTestId('topics-catalog').click()
  await page.getByTestId('catalog-create-toggle').click()
  await page.getByTestId('catalog-create-name').fill(topicName)
  await page.getByTestId('catalog-create-submit').click()
  await expect(page.getByTestId('catalog-confirm-topics')).toContainText('(1)')
  await page.getByTestId('catalog-confirm-topics').click()
  await expect(page.getByTestId('tag-chips')).toContainText(topicName)

  // Publish succeeds with all required fields present.
  await page.getByTestId('publish').click()
  await expect(page).toHaveURL(/\/author\/questions$/, { timeout: 30_000 })
  await expect(page.getByTestId('question-list')).toContainText('Publicada')
})
