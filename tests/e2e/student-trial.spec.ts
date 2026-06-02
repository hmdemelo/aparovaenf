import { test, expect, type Page } from '@playwright/test'

/**
 * US1 — student trial loop (anonymous portion).
 *
 * A visitor selects a career, answers the 2 free anonymous questions, and is
 * then asked to sign up. The post-signup → paywall portion depends on the auth
 * UI (signup/login), delivered in a later slice.
 */

async function answerCurrentQuestion(page: Page) {
  // Wait for the question card and its alternatives, pick the first one.
  const firstAlternative = page.getByTestId('alternative').first()
  await firstAlternative.waitFor({ state: 'visible' })
  await firstAlternative.click()
  await page.getByRole('button', { name: 'Responder' }).click()
  // Feedback panel confirms the answer was graded (first API hit compiles in dev).
  await expect(page.getByTestId('answer-feedback')).toBeVisible({ timeout: 30_000 })
}

test('visitor answers two questions then hits the signup gate', async ({ page }) => {
  // Dev-mode on-demand compilation makes the first navigations slow.
  test.setTimeout(90_000)
  await page.goto('/')

  // Choose Enfermagem and start the feed (home compiles on first hit).
  const careerButton = page.getByTestId('career-enfermagem')
  await careerButton.waitFor({ state: 'visible', timeout: 30_000 })
  await careerButton.click()
  await expect(page).toHaveURL(/\/feed\?career=enfermagem/, { timeout: 30_000 })

  // First free question.
  await answerCurrentQuestion(page)
  await page.getByTestId('next-question').click()

  // Second free question.
  await answerCurrentQuestion(page)
  await page.getByTestId('next-question').click()

  // After 2 answers, the signup gate must appear.
  await expect(page.getByTestId('signup-gate')).toBeVisible({ timeout: 15_000 })
  await expect(
    page.getByRole('link', { name: 'Criar conta gratuita' }),
  ).toBeVisible()
})
