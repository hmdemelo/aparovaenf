import Link from 'next/link'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { ArrowRight, CheckCircle2, MessageCircle } from 'lucide-react'
import { createSupabaseServiceClient } from '@/lib/db/server'
import { getCurrentUser, isSubscriber } from '@/lib/auth/roles'
import { resolvePostLoginPath } from '@/lib/auth/post-login'
import { AprovaenfLogo } from '@/features/brand/aprovaenf-logo'
import { track } from '@/features/analytics/product-events-server'
import { ProductEventNames } from '@/features/analytics/product-events'
import { PricingSection } from '@/features/billing/pricing-section'
import { confirmStripeMockCheckout } from '@/features/billing/mock-checkout'
import { isStripeMockMode } from '@/features/billing/stripe-config'
import { getCoreServerEnv, getServerEnv } from '@/lib/env/server'

export const dynamic = 'force-dynamic'

const STEPS = [
  'Escolha sua carreira e comece a responder na hora.',
  'Leia a questão, escolha a alternativa e veja se acertou.',
  'Receba o comentário do especialista e siga para a próxima.',
]

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{
    checkout?: string
    subscription_id?: string
  }>
}) {
  const params = await searchParams
  const env = getCoreServerEnv()
  const mockCheckoutEnabled = isStripeMockMode({
    NODE_ENV: env.NODE_ENV,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? '',
  })
  const supabase = createSupabaseServiceClient()
  const { data: careers } = await supabase
    .from('careers')
    .select('id, name, slug')
    .eq('is_launch_career', true)
    .order('name')

  await track({ event_name: ProductEventNames.LANDING_VIEWED })

  async function simulatePayment(formData: FormData) {
    'use server'
    const subscriptionId = String(formData.get('subscription_id') ?? '')
    if (!subscriptionId) return

    const user = await getCurrentUser()
    if (!user) return
    const db = createSupabaseServiceClient()
    const result = await confirmStripeMockCheckout(db, {
      env: getServerEnv(),
      subscriptionId,
      authenticatedUserId: user.id,
    })
    if (result.ok && result.activated) {
      redirect('/feed?career=enfermeiro-a&subscription=success')
    }
  }

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

    const cookieStore = await cookies()
    cookieStore.set('selected_career', slug, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: 'lax',
    })

    const next = `/feed?career=${slug}`
    const user = await getCurrentUser()
    // Visitors must authenticate before reaching the feed; the chosen career
    // travels in `next` so it survives signup/login.
    if (!user) {
      redirect(`/signup?next=${encodeURIComponent(next)}`)
    }

    const subscriber = user.role === 'student' ? await isSubscriber() : false
    redirect(
      resolvePostLoginPath({
        role: user.role,
        isSubscriber: subscriber,
        launchCareerSlug: null,
        next,
      }),
    )
  }

  return (
    <>
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex max-w-[980px] items-center justify-end px-4 py-3 sm:px-6">
          <Link
            href="/login"
            data-testid="landing-login"
            className="rounded-full border border-[color:var(--line)] bg-white/80 px-5 py-2 text-sm font-semibold text-[var(--teal)] shadow-[0_8px_20px_-16px_rgba(0,84,64,0.8)] backdrop-blur transition hover:bg-white active:scale-[0.98]"
          >
            Login
          </Link>
        </div>
      </header>

      <main id="top" className="flex flex-col">
        {mockCheckoutEnabled &&
          params.checkout === 'mock' &&
          params.subscription_id && (
            <div className="border-b border-[var(--mint-dim)] bg-[var(--teal)] px-4 py-6 text-white shadow-[0_8px_30px_rgba(20,43,38,0.2)]">
              <div className="mx-auto flex max-w-[980px] flex-col items-center justify-between gap-4 md:flex-row">
                <div className="text-center md:text-left">
                  <p className="font-display text-lg font-semibold">
                    Ambiente de Desenvolvimento (Mock Checkout)
                  </p>
                  <p className="mt-1 text-xs text-[var(--mint-dim)]">
                    A simulação local foi habilitada explicitamente. Confirme o
                    pagamento para liberar seu acesso às questões.
                  </p>
                </div>
                <form action={simulatePayment}>
                  <input
                    type="hidden"
                    name="subscription_id"
                    value={params.subscription_id}
                  />
                  <button
                    type="submit"
                    className="rounded-full bg-[var(--mint-strong)] px-5 py-3 text-sm font-semibold text-[var(--teal-ink)] shadow-[0_12px_24px_-10px_rgba(160,243,212,0.8)] transition hover:brightness-105 active:scale-[0.98]"
                  >
                    Simular Pagamento Confirmado
                  </button>
                </form>
              </div>
            </div>
          )}
        {/* Hero + career selection */}
        <section className="aprova-hero-brand px-4 pb-12 pt-9 sm:pb-14 sm:pt-12">
        <div className="mx-auto max-w-[640px] text-center">
          <AprovaenfLogo
            className="justify-center text-[var(--teal)]"
            textClassName="text-[1.65rem]"
          />
          <h1 className="font-display mt-5 text-[34px] font-semibold leading-[1.05] text-[var(--ink)] sm:text-[44px]">
            Questões comentadas para concursos da saúde
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[16.5px] leading-[1.55] text-[var(--muted)]">
            Pratique no seu ritmo, direto do celular: uma questão por vez,
            resposta na hora e comentário de quem já foi aprovado.
          </p>

          <div className="mx-auto mt-8 flex max-w-md flex-col gap-3">
            <p className="text-sm font-semibold text-[var(--ink)]">
              Escolha sua carreira para começar:
            </p>
            {(careers ?? []).map((career) => (
              <form key={career.id} action={startFeed}>
                <input type="hidden" name="career" value={career.slug} />
                <input type="hidden" name="career_id" value={career.id} />
                <button
                  type="submit"
                  data-testid={`career-${career.slug}`}
                  className="group flex w-full items-center justify-between rounded-[18px] bg-[var(--teal)] px-5 py-4 font-semibold text-white shadow-[0_18px_34px_-26px_rgba(0,84,64,0.9)] transition hover:bg-[var(--teal-mid)] active:scale-[0.98]"
                >
                  <span>{career.name}</span>
                  <ArrowRight
                    size={18}
                    className="transition group-hover:translate-x-0.5"
                  />
                </button>
              </form>
            ))}
          </div>
          <p className="mt-4 text-xs font-semibold text-[var(--muted)]">
            Crie sua conta e assine para praticar sem limites.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section
        aria-labelledby="how-heading"
        className="px-4 py-12"
      >
        <div className="mx-auto max-w-[760px]">
          <h2
            id="how-heading"
            className="font-display mb-6 text-center text-[26px] font-semibold text-[var(--ink)]"
          >
            Como funciona
          </h2>
          <ol className="grid gap-3 md:grid-cols-3">
            {STEPS.map((step) => (
              <li
                key={step}
                className="aprova-paper-card flex items-start gap-3 p-4 text-sm leading-relaxed text-[var(--muted)]"
              >
                <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-[var(--teal)]" />
                {step}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-4 py-12">
        <PricingSection />
      </section>

      {/* Final CTA */}
      <section className="bg-[var(--teal)] px-4 py-12 text-center">
        <div className="mx-auto max-w-xl">
          <MessageCircle className="mx-auto mb-3 text-[var(--mint-dim)]" size={26} />
          <h2 className="font-display text-[26px] font-semibold text-white">
            Comece agora mesmo
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--mint-dim)]">
            Crie sua conta e escolha seu plano para praticar com questões
            comentadas. Role para cima e escolha sua carreira.
          </p>
          <Link
            href="#top"
            className="mt-5 inline-flex items-center gap-2 rounded-[18px] bg-[var(--mint-strong)] px-6 py-3 font-semibold text-[var(--teal-ink)] transition hover:brightness-105 active:scale-[0.98]"
          >
            Quero começar
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      <footer className="bg-white/80 px-4 py-8 text-center text-xs text-[var(--muted)]">
        <nav className="flex justify-center gap-4">
          <Link href="/termos" className="font-semibold underline">
            Termos de uso
          </Link>
          <Link href="/privacidade" className="font-semibold underline">
            Política de privacidade
          </Link>
          <Link href="/login" className="font-semibold underline">
            Entrar
          </Link>
        </nav>
        <p className="mt-3">© {new Date().getFullYear()} aprovaenf</p>
      </footer>
    </main>
    </>
  )
}
