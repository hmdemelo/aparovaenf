import { test, expect, type Page } from '@playwright/test'

async function login(page: Page, email: string, next: string) {
  await page.goto(`/login?next=${encodeURIComponent(next)}`)
  await page.getByTestId('email').fill(email)
  await page.getByTestId('password').fill('aprovaenf123')
  await page.getByTestId('submit').click()
  await expect(page).toHaveURL(/\/admin/, {
    timeout: 30_000,
  })
  await page.goto(next)
}

test('admin imports questions for an author from authors page', async ({ page }) => {
  test.setTimeout(120_000)
  await login(page, 'admin@aprovaenf.local', '/admin/authors')

  await page.getByTestId('open-import-author').first().click()
  await expect(page.getByRole('dialog')).toContainText('Importar questões')

  await page.getByTestId('bulk-import-file').setInputFiles({
    name: 'questoes.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(
      [
        'career;subject;difficulty;statement;alt_a;alt_b;general_comment',
        'Enfermeiro(a);Saude Publica e SUS;facil;"Questao E2E importada";A;B;"Comentario"',
      ].join('\n'),
    ),
  })
  await page.getByTestId('bulk-import-submit').click()

  await expect(page.getByText('1 importada')).toBeVisible({ timeout: 30_000 })
})
