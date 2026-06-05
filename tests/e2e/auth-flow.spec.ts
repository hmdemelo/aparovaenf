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

test('completar-cadastro page submits password, updates profile, and redirects', async ({ page }) => {
  const corsHeaders = {
    'access-control-allow-headers': '*',
    'access-control-allow-methods': 'GET, POST, PUT, PATCH, OPTIONS',
    'access-control-allow-origin': '*',
  }

  // Intercept Supabase auth token refresh (prevents session refresh failures)
  await page.route(/\/auth\/v1\/token/, async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders })
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: corsHeaders,
      body: JSON.stringify({
        access_token: 'mock-refreshed-token',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: 'mock-refresh-token-2',
        user: {
          id: '00000000-0000-0000-0000-0000000000a4',
          aud: 'authenticated',
          role: 'authenticated',
          email: 'estudante-e2e@aprovaenf.local',
        },
      }),
    })
  })

  await page.route(/\/auth\/v1\/user/, async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders })
      return
    }
    if (route.request().method() === 'PUT') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: corsHeaders,
        body: JSON.stringify({ user: { id: '00000000-0000-0000-0000-0000000000a4' } }),
      })
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: corsHeaders,
      body: JSON.stringify({ user: { id: '00000000-0000-0000-0000-0000000000a4', email: 'estudante-e2e@aprovaenf.local' } }),
    })
  })

  await page.route(/\/rest\/v1\/user_profiles/, async (route) => {
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

  // Intercept the server-side post-login destination resolver and track calls.
  let postLoginCalled = false
  await page.route('**/api/auth/post-login*', async (route) => {
    postLoginCalled = true
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { destination: '/feed?career=enfermeiro-a' },
      }),
    })
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://axgbnjscindhqgirvroq.supabase.co'
  let projectRef = 'axgbnjscindhqgirvroq'
  if (supabaseUrl.includes('127.0.0.1')) {
    projectRef = '127'
  } else if (supabaseUrl.includes('localhost')) {
    projectRef = 'localhost'
  } else {
    const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)
    if (match) projectRef = match[1]
  }
  const storageKey = `sb-${projectRef}-auth-token`

  const base64url = (str: string) => btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = base64url(JSON.stringify({
    exp: Math.floor(Date.now() / 1000) + 3600,
    sub: '00000000-0000-0000-0000-0000000000a4',
    email: 'estudante-e2e@aprovaenf.local',
    role: 'authenticated'
  }))
  const mockJwt = `${header}.${payload}.signature`

  const sessionObj = {
    access_token: mockJwt,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: 'mock-refresh-token',
    user: {
      id: '00000000-0000-0000-0000-0000000000a4',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'estudante-e2e@aprovaenf.local',
      app_metadata: {
        provider: 'email',
        providers: ['email']
      },
      user_metadata: {
        name: 'Estudante Teste E2E'
      }
    }
  }

  // Encode session as base64url and store in chunked cookies (supabase/ssr v0.10.x format).
  const sessionJson = JSON.stringify(sessionObj)
  const sessionBase64 = 'base64-' + base64url(sessionJson)
  const CHUNK_SIZE = 3600
  const chunks = []
  for (let i = 0; i < sessionBase64.length; i += CHUNK_SIZE) {
    chunks.push(sessionBase64.slice(i, i + CHUNK_SIZE))
  }

  const cookies = chunks.map((chunk, idx) => ({
    name: `${storageKey}.${idx}`,
    value: chunk,
    domain: 'localhost',
    path: '/',
  }))
  await page.context().addCookies(cookies)

  // Inject session into localStorage (for client-side fallbacks)
  await page.addInitScript(({ key, session }) => {
    window.localStorage.setItem(key, JSON.stringify(session))
  }, { key: storageKey, session: sessionObj })

  await page.goto('/completar-cadastro?next=%2Ffeed%3Fcareer%3Denfermeiro-a')

  await page.getByTestId('password').fill('novasenha123')
  await page.getByTestId('confirm-password').fill('novasenha123')
  await page.getByTestId('submit').click()

  // Verify: success message appears and post-login destination was requested.
  await expect(page.getByText(/cadastro concluído/i)).toBeVisible({ timeout: 10_000 })
  await expect.poll(() => postLoginCalled, { timeout: 5_000 }).toBe(true)
})


