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
  await page.getByTestId('subject').selectOption({ index: 1 })
  await page.getByTestId('statement').fill('Questão E2E com banca inline e tags?')
  await page.getByTestId('alt-text-0').fill('Alternativa incorreta')
  await page.getByTestId('alt-text-1').fill('Alternativa correta')
  await page.getByTestId('correct-1').check()
  await page.getByTestId('general-comment').fill('Comentário geral da questão E2E.')

  // Inline board registration: search a non-existent board, then click "+".
  await page.getByTestId('board-search').fill(boardName)
  await expect(page.getByTestId('board-add')).toBeVisible()
  await page.getByTestId('board-add').click()
  // After creation the field shows the new board's name (auto-selected) and the
  // "+" button disappears because the board now exists.
  await expect(page.getByTestId('board-search')).toHaveValue(boardName, {
    timeout: 30_000,
  })
  await expect(page.getByTestId('board-add')).toHaveCount(0)

  // Dynamic tags: type and press Enter to add as a chip.
  await page.getByTestId('tag-input').fill('biosseguranca-e2e')
  await page.getByTestId('tag-input').press('Enter')
  await expect(page.getByTestId('tag-chips')).toContainText('biosseguranca-e2e')

  // Publish succeeds with all required fields present.
  await page.getByTestId('publish').click()
  await expect(page).toHaveURL(/\/author\/questions$/, { timeout: 30_000 })
  await expect(page.getByTestId('question-list')).toContainText('Publicada')
})
