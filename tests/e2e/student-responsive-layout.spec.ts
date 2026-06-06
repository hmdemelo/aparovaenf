import { expect, test, type Page } from '@playwright/test'

async function loginAsSubscriber(page: Page) {
  const next = '/feed?career=enfermeiro-a'
  await page.goto(`/login?next=${encodeURIComponent(next)}`)
  await page.getByTestId('email').fill('assinante@aprovaenf.local')
  await page.getByTestId('password').fill('aprovaenf123')
  await page.getByTestId('submit').click()
  await expect(page).toHaveURL(/\/feed\?career=enfermeiro-a/, {
    timeout: 30_000,
  })
}

test('desktop student layout fills the viewport and persists sidebar collapse', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium')
  test.setTimeout(90_000)

  await loginAsSubscriber(page)

  const layout = page.getByTestId('student-layout')
  const sidebar = page.getByTestId('student-sidebar')

  await expect(layout).toBeVisible()
  await expect(sidebar).toBeVisible()
  await expect(page.getByTestId('student-mobile-header')).toBeHidden()

  const geometry = await page.evaluate(() => {
    const shell = document.querySelector<HTMLElement>(
      '[data-testid="student-layout"]',
    )
    const panel = document.querySelector<HTMLElement>(
      '[data-testid="student-content"]',
    )
    const rect = shell?.getBoundingClientRect()
    return {
      width: rect?.width,
      height: rect?.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      panelOverflowY: panel ? getComputedStyle(panel).overflowY : null,
    }
  })

  expect(geometry.width).toBe(geometry.viewportWidth)
  expect(geometry.height).toBe(geometry.viewportHeight)
  expect(geometry.panelOverflowY).toBe('auto')

  await sidebar.getByRole('button', { name: 'Recolher menu' }).click()
  await expect(sidebar).toHaveAttribute('data-collapsed', 'true')
  await expect(sidebar).toHaveCSS('width', '72px')
  await expect
    .poll(() =>
      page.evaluate(() =>
        localStorage.getItem('aprovaenf:student-sidebar-collapsed'),
      ),
    )
    .toBe('true')

  await page.reload()
  await expect(page.getByTestId('student-sidebar')).toHaveAttribute(
    'data-collapsed',
    'true',
  )
  await expect(
    page.getByTestId('student-sidebar').getByRole('button', {
      name: 'Expandir menu',
    }),
  ).toBeVisible()
})

test('mobile student layout keeps navigation at the top without bottom bar or overflow', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'Mobile Chrome')
  test.setTimeout(90_000)

  await loginAsSubscriber(page)

  const header = page.getByTestId('student-mobile-header')
  const mobileNav = page.getByTestId('student-mobile-nav')

  await expect(header).toBeVisible()
  await expect(page.getByTestId('student-sidebar')).toBeHidden()
  await expect(mobileNav.getByRole('link', { name: 'Estudo' })).toBeVisible()
  await expect(
    mobileNav.getByRole('link', { name: 'Favoritos' }),
  ).toBeVisible()
  await expect(mobileNav.getByRole('link', { name: 'Erros' })).toBeVisible()
  await expect(mobileNav.getByRole('button', { name: 'Conta' })).toBeVisible()
  await expect(page.locator('.aprova-bottom-nav')).toHaveCount(0)

  const mobileGeometry = await page.evaluate(() => {
    const header = document.querySelector<HTMLElement>(
      '[data-testid="student-mobile-header"]',
    )
    const rect = header?.getBoundingClientRect()
    return {
      headerTop: rect?.top,
      headerRight: rect?.right,
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
    }
  })

  expect(mobileGeometry.headerTop).toBe(0)
  expect(mobileGeometry.headerRight).toBeLessThanOrEqual(
    mobileGeometry.viewportWidth,
  )
  expect(mobileGeometry.documentWidth).toBeLessThanOrEqual(
    mobileGeometry.viewportWidth,
  )
})
