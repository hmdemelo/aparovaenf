import { test, expect } from '@playwright/test'

/**
 * US2 — author publishes a commented question.
 *
 * Logs in as the seeded author, creates a question, confirms publish is blocked
 * without a general comment, then publishes successfully once it is added.
 */

test('author logs in, is blocked publishing without a comment, then publishes', async ({
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

  // Fill classification and content (leave the general comment empty for now).
  await page.getByTestId('subject').selectOption({ index: 1 })
  await page.getByTestId('statement').fill('Questão E2E: qual a conduta correta?')
  await page.getByTestId('alt-text-0').fill('Alternativa incorreta')
  await page.getByTestId('alt-text-1').fill('Alternativa correta')
  // Mark the second alternative as the correct one.
  await page.getByTestId('correct-1').check()

  // Publish without a general comment -> blocked with a clear reason.
  await page.getByTestId('publish').click()
  await expect(page.getByTestId('editor-errors')).toContainText(
    'general comment is required to publish',
    { timeout: 30_000 },
  )

  // Add the general comment and publish successfully.
  await page.getByTestId('general-comment').fill('Comentário geral explicando a resposta.')
  await page.getByTestId('publish').click()

  // Back on the list, the new question shows as published.
  await expect(page).toHaveURL(/\/author\/questions$/, { timeout: 30_000 })
  await expect(page.getByTestId('question-list')).toContainText('Publicada')
})
