import { Check, Sparkles } from 'lucide-react'
import { PLAN_LIST } from './plans'

/**
 * Public pricing block for the landing page. Prices come from the single source
 * of truth in plans.ts (monthly R$ 29,90 / annual R$ 287,00).
 */
export function PricingSection() {
  return (
    <section aria-labelledby="pricing-heading" className="mx-auto max-w-4xl">
      <h2
        id="pricing-heading"
        className="font-display mb-2 text-center text-[26px] font-semibold text-[var(--teal)]"
      >
        Escolha seu plano
      </h2>
      <p className="mx-auto mb-6 max-w-xl text-center text-[15px] leading-relaxed text-[var(--muted)]">
        Continue resolvendo questões comentadas, salve favoritas e revise seus
        erros com acesso de assinante.
      </p>

      <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr_1.1fr]">
        <div className="aprova-paper-card flex flex-col p-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--muted)]">
              Trial
            </p>
            <h3 className="font-display mt-1 text-[21px] font-semibold text-[var(--ink)]">
              Gratuito
            </h3>
            <p className="mt-1 text-2xl font-semibold text-[var(--ink)]">R$ 0</p>
          </div>
          <ul className="mt-5 flex flex-col gap-3 text-sm text-[var(--muted)]">
            <li className="flex items-center gap-2">
              <Check size={16} className="text-[var(--teal)]" /> 5 questões no teste
            </li>
            <li className="flex items-center gap-2">
              <Check size={16} className="text-[var(--teal)]" /> Comentários das questões
            </li>
            <li className="flex items-center gap-2 text-[var(--hint)]">
              Favoritos e histórico liberados na assinatura
            </li>
          </ul>
        </div>

        {PLAN_LIST.map((plan) => (
          <div
            key={plan.id}
            className={`flex flex-col gap-4 rounded-[22px] p-5 shadow-[0_18px_46px_-34px_rgba(20,43,38,0.45)] ${
              plan.id === 'annual'
                ? 'bg-[var(--teal)] text-white'
                : 'border border-[color:var(--line)] bg-white/82'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p
                  className={`text-[11px] font-bold uppercase tracking-[0.08em] ${
                    plan.id === 'annual'
                      ? 'text-[var(--mint-dim)]'
                      : 'text-[var(--muted)]'
                  }`}
                >
                  Plano PRO
                </p>
                <h3 className="font-display mt-1 text-[21px] font-semibold">
                  {plan.label}
                </h3>
              </div>
              {plan.id === 'annual' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(160,243,212,0.18)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--mint-strong)]">
                  <Sparkles size={13} />
                  Melhor valor
                </span>
              )}
            </div>

            <div>
              <p className="font-display text-[30px] font-semibold leading-none">
                {plan.priceLabel}
              </p>
              <p
                className={`mt-1 text-xs ${
                  plan.id === 'annual' ? 'text-[var(--mint-dim)]' : 'text-[var(--muted)]'
                }`}
              >
                {plan.cadenceLabel}
              </p>
              <div className="mt-2.5">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em] ${
                    plan.id === 'annual'
                      ? 'bg-[rgba(160,243,212,0.18)] text-[var(--mint-strong)]'
                      : 'bg-[var(--line)] text-[var(--muted)]'
                  }`}
                >
                  Pagamento com cartão
                </span>
              </div>
            </div>

            <ul
              className={`flex flex-col gap-2 text-sm ${
                plan.id === 'annual' ? 'text-white/86' : 'text-[var(--muted)]'
              }`}
            >
              <li className="flex items-center gap-2">
                <Check size={16} className="text-[var(--mint-dim)]" /> Questões ilimitadas
              </li>
              <li className="flex items-center gap-2">
                <Check size={16} className="text-[var(--mint-dim)]" /> Favoritos salvos
              </li>
              <li className="flex items-center gap-2">
                <Check size={16} className="text-[var(--mint-dim)]" /> Histórico de erros
              </li>
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-xs text-[var(--muted)]">
        Pagamento seguro processado pela Stripe.
      </p>
    </section>
  )
}
