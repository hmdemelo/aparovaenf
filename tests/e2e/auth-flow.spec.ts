import { expect, test } from '@playwright/test'

test('auth callback rejects missing codes without leaving the app', async ({ page }) => {
  const response = await page.request.get(
    '/api/auth/callback?next=%2F%2Fevil.example%2Ffeed',
    { maxRedirects: 0 },
  )

  expect(response.status()).toBe(307)
  const location = response.headers().location
  expect(location).toContain('/login')
  expect(location).toContain('auth_error=missing_code')
  expect(location).toContain('next=%2F')
})

test('login page exposes Google and magic-link authentication', async ({ page }) => {
  await page.route(/\/auth\/v1\/otp/, async (route) => {
    const corsHeaders = {
      'access-control-allow-headers': '*',
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-origin': '*',
    }

    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: corsHeaders,
      body: JSON.stringify({}),
    })
  })

  await page.goto('/login?next=%2Ffeed%3Fcareer%3Denfermeiro-a')
  await expect(page.getByTestId('google-auth')).toBeVisible()

  await page.getByTestId('email').fill('aluno@aprovaenf.local')
  await page.getByTestId('magic-link-submit').click()

  await expect(page.getByText(/enviamos um link de acesso/i)).toBeVisible()
})
