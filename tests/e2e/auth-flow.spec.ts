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

test('signup without password sends magic link', async ({ page }) => {
  await page.route(/\/auth\/v1\/otp/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({}),
    })
  })

  await page.goto('/signup?next=%2Ffeed%3Fcareer%3Denfermeiro-a')
  await expect(page.getByTestId('google-auth')).toBeVisible()

  await page.getByTestId('name').fill('Estudante Teste E2E')
  await page.getByTestId('email').fill('estudante-e2e@aprovaenf.local')
  await page.getByTestId('magic-link-submit').click()

  await expect(page.getByText(/enviamos um link de acesso/i)).toBeVisible()
})

test('completar-cadastro redirects unauthenticated users to login', async ({ page }) => {
  await page.goto('/completar-cadastro?next=%2Ffeed%3Fcareer%3Denfermeiro-a')

  await expect(page).toHaveURL(/\/login\?/)
  expect(page.url()).toContain(
    'next=%2Fcompletar-cadastro%3Fnext%3D%252Ffeed%253Fcareer%253Denfermeiro-a',
  )
  await expect(page.getByRole('heading', { name: /entrar na sua conta/i })).toBeVisible()
})
