import { redirect } from 'next/navigation'
import { FeedShell } from '@/features/student-feed/feed-shell'

export const dynamic = 'force-dynamic'

// /feed?career=<slug>&board=<slug>
export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ career?: string; board?: string }>
}) {
  const { career, board } = await searchParams
  if (!career) redirect('/')

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-3">
          <span className="text-lg font-bold text-emerald-600">aprovaenf</span>
          <span className="text-xs text-slate-600">Feed de questões</span>
        </div>
      </header>
      <FeedShell careerSlug={career} boardSlug={board} />
    </main>
  )
}
