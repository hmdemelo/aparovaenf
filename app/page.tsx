import { redirect } from 'next/navigation'
import { createSupabaseServiceClient } from '@/lib/db/server'
import { track } from '@/features/analytics/product-events-server'
import { ProductEventNames } from '@/features/analytics/product-events'

export const dynamic = 'force-dynamic'

// Minimal entry point for the trial. The full landing page is delivered in US6;
// this lets a visitor pick a launch career and start the feed immediately.
export default async function HomePage() {
  const supabase = createSupabaseServiceClient()
  const { data: careers } = await supabase
    .from('careers')
    .select('id, name, slug')
    .eq('is_launch_career', true)
    .order('name')

  async function startFeed(formData: FormData) {
    'use server'
    const slug = String(formData.get('career') ?? '')
    const id = String(formData.get('career_id') ?? '')
    // Validate the slug shape before using it in a redirect.
    if (!/^[a-z][a-z-]*$/.test(slug)) return
    await track({
      event_name: ProductEventNames.CAREER_SELECTED,
      career_id: id || null,
      metadata: { career_slug: slug },
    })
    redirect(`/feed?career=${slug}`)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-emerald-600">aprovaenf</h1>
        <p className="mt-3 text-slate-600">
          Questões comentadas para concursos da saúde. Escolha sua carreira e
          comece a praticar — sem cadastro.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          {(careers ?? []).map((career) => (
            <form key={career.id} action={startFeed}>
              <input type="hidden" name="career" value={career.slug} />
              <input type="hidden" name="career_id" value={career.id} />
              <button
                type="submit"
                data-testid={`career-${career.slug}`}
                className="w-full rounded-xl bg-emerald-600 px-4 py-4 font-semibold text-white transition hover:bg-emerald-700"
              >
                {career.name}
              </button>
            </form>
          ))}
        </div>

        <p className="mt-6 text-xs text-slate-400">
          2 questões grátis antes do cadastro · mais 3 após criar a conta
        </p>
      </div>
    </main>
  )
}
