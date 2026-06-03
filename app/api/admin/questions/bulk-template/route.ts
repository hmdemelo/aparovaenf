import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { adminAuthFail } from '@/lib/api/admin-guard'
import { resolveAdminContext } from '@/features/admin/admin-permissions'

export const dynamic = 'force-dynamic'

export async function GET() {
  const ctx = await resolveAdminContext()
  if (!ctx.ok) return adminAuthFail(ctx.code)

  const templatePath = join(process.cwd(), 'docs/template-importacao-questoes.csv')
  const csv = await readFile(templatePath, 'utf8')

  return new Response(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition':
        'attachment; filename="template-importacao-questoes.csv"',
    },
  })
}
