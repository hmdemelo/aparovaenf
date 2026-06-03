import { redirect } from 'next/navigation'
import { resolveAdminContext } from '@/features/admin/admin-permissions'
import { listAuthors } from '@/features/admin/admin-service'
import { AdminAuthorsManager } from '@/features/admin/admin-authors-manager'

export const dynamic = 'force-dynamic'

export default async function AdminAuthorsPage() {
  const ctx = await resolveAdminContext()
  if (!ctx.ok) redirect('/login?next=/admin/authors')

  const authors = await listAuthors(ctx.db)

  return <AdminAuthorsManager authors={authors} />
}
