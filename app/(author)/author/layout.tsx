import { redirect } from 'next/navigation'
import { resolveAuthorContext } from '@/features/authors/author-context'
import { loadAccountProfile } from '@/features/account/account-service'
import { AuthorSidebar } from '@/components/author-sidebar'

export const dynamic = 'force-dynamic'

export default async function AuthorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const ctx = await resolveAuthorContext()
  if (!ctx.ok) redirect('/login?next=/author/questions')

  const account = await loadAccountProfile(ctx.db, ctx.userId)

  return (
    <main className="aprova-frame-main min-h-screen px-4 py-6 sm:py-8">
      <div className="aprova-admin-shell mx-auto flex w-full max-w-[980px] max-md:flex-col">
        <AuthorSidebar account={account} />
        <section className="aprova-content-panel min-w-0 flex-1 bg-white px-5 py-6 sm:px-[30px]">
          {children}
        </section>
      </div>
    </main>
  )
}
