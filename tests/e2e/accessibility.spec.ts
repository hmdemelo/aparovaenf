import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * US6 — accessibility smoke. Scans the landing and the feed for serious/critical
 * WCAG issues using axe-core. Keeps the bar at serious+ to stay actionable.
 */

async function seriousViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze()
  return results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  )
}

async function login(page: Page, email: string, next: string) {
  await page.goto(`/login?next=${encodeURIComponent(next)}`)
  await page.getByTestId('email').fill(email)
  await page.getByTestId('password').fill('aprovaenf123')
  await page.getByTestId('submit').click()
  await expect(page).toHaveURL(new RegExp(next.replace(/[/?]/g, '\\$&')), {
    timeout: 30_000,
  })
}

test('landing has no serious accessibility violations', async ({ page }) => {
  test.setTimeout(60_000)
  await page.goto('/')
  await expect(page.getByTestId('career-enfermeiro-a')).toBeVisible({
    timeout: 30_000,
  })
  const violations = await seriousViolations(page)
  expect(violations, JSON.stringify(violations, null, 2)).toEqual([])
})

test('feed has no serious accessibility violations', async ({ page }) => {
  test.setTimeout(90_000)
  await login(page, 'assinante@aprovaenf.local', '/feed?career=enfermeiro-a')
  await expect(page.getByTestId('alternative').first()).toBeVisible({
    timeout: 30_000,
  })
  const violations = await seriousViolations(page)
  expect(violations, JSON.stringify(violations, null, 2)).toEqual([])
})

