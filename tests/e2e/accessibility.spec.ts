import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * US6 — accessibility smoke. Scans the landing and the feed for serious/critical
 * WCAG issues using axe-core. Keeps the bar at serious+ to stay actionable.
 */

async function seriousViolations(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze()
  return results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  )
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
  await page.goto('/feed?career=enfermeiro-a')
  await expect(page.getByTestId('alternative').first()).toBeVisible({
    timeout: 30_000,
  })
  const violations = await seriousViolations(page)
  expect(violations, JSON.stringify(violations, null, 2)).toEqual([])
})
