import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServiceClient } from '@/lib/db/server'
import { track } from '@/features/analytics/product-events-server'
import { ProductEventNames } from '@/features/analytics/product-events'
import { PublicAuthors } from '@/features/authors/public-authors'
import { PricingSection } from '@/features/billing/pricing-section'

export const dynamic = 'force-dynamic'

const STEPS = [
  'Escolha sua carreira e comece a responder na hora.',
  'Leia a questão, escolha a alternativa e veja se acertou.',
  'Receba o comentário do especialista e siga para a próxima.',
]

export default async function LandingPage() {
  const supabase = createSupabaseServiceClient()
  const [{ data: careers }, { data: authors }] = await Promise.all([
    supabase
      .from('careers')
      .select('id, name, slug')
      .eq('is_launch_career', true)
      .order('name'),
    supabase
      .from('author_profiles')
      .select('id, display_name, short_bio')
      .eq('is_public', true)
      .order('display_name'),
  ])

  await track({ event_name: ProductEventNames.LANDING_VIEWED })

  async function startFeed(formData: FormData) {
    'use server'
    const slug = String(formData.get('career') ?? '')
    const id = String(formData.get('career_id') ?? '')
    if (!/^[a-z][a-z-]*$/.test(slug)) return
    await track({
      event_name: ProductEventNames.CAREER_SELECTED,
      career_id: id || null,
      metadata: { career_slug: slug },
    })
    redirect(`/feed?career=${slug}`)
  }

  return (
    <main className="flex flex-col">
      {/* Hero + career selection */}
      <section className="bg-white px-4 py-14">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-sm font-semibold text-emerald-600">aprovaenf</p>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
            Questões comentadas para concursos da saúde
          </h1>
          <p className="mt-3 text-slate-600">
            Pratique no seu ritmo, direto do celular: uma questão por vez,
            resposta na hora e comentário de quem já foi aprovado.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <p className="text-sm font-medium text-slate-700">
              Escolha sua carreira para começar:
            </p>
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
          <p className="mt-4 text-xs text-slate-600">
            2 questões grátis antes do cadastro · mais 3 após criar a conta
          </p>
        </div>
      </section>

      {/* How it works */}
      <section
        aria-labelledby="how-heading"
        className="bg-slate-50 px-4 py-12"
      >
        <div className="mx-auto max-w-xl">
          <h2
            id="how-heading"
            className="mb-4 text-center text-xl font-bold text-slate-900"
          >
            Como funciona
          </h2>
          <ol className="flex flex-col gap-3">
            {STEPS.map((step, i) => (
              <li
                key={step}
                className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Authors */}
      <section className="bg-white px-4 py-12">
        <PublicAuthors authors={authors ?? []} />
      </section>

      {/* Pricing */}
      <section className="bg-slate-50 px-4 py-12">
        <PricingSection />
      </section>

      {/* Final CTA */}
      <section className="bg-emerald-600 px-4 py-12 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="text-xl font-bold text-white">
            Comece agora, sem cadastro
          </h2>
          <p className="mt-2 text-sm text-emerald-50">
            Experimente o valor antes de assinar. Role para cima e escolha sua
            carreira.
          </p>
          <Link
            href="#top"
            className="mt-5 inline-block rounded-xl bg-white px-6 py-3 font-semibold text-emerald-700"
          >
            Quero começar
          </Link>
        </div>
      </section>

      <footer className="bg-white px-4 py-8 text-center text-xs text-slate-600">
        <nav className="flex justify-center gap-4">
          <Link href="/termos" className="underline">
            Termos de uso
          </Link>
          <Link href="/privacidade" className="underline">
            Política de privacidade
          </Link>
          <Link href="/login" className="underline">
            Entrar
          </Link>
        </nav>
        <p className="mt-3">© {new Date().getFullYear()} aprovaenf</p>
      </footer>
    </main>
  )
}
