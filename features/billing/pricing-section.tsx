import { Check } from 'lucide-react'
import { PLAN_LIST } from './plans'

/**
 * Public pricing block for the landing page. Prices come from the single source
 * of truth in plans.ts (monthly R$ 29,90 / annual R$ 287,00).
 */
export function PricingSection() {
  return (
    <section aria-labelledby="pricing-heading" className="mx-auto max-w-xl">
      <h2
        id="pricing-heading"
        className="mb-4 text-center text-xl font-bold text-slate-900"
      >
        Planos
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {PLAN_LIST.map((plan) => (
          <div
            key={plan.id}
            className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5"
          >
            <div>
              <p className="text-sm font-semibold text-slate-500">{plan.label}</p>
              <p className="text-2xl font-bold text-slate-900">{plan.priceLabel}</p>
              <p className="text-xs text-slate-600">{plan.cadenceLabel}</p>
            </div>
            <ul className="flex flex-col gap-1 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <Check size={14} className="text-emerald-600" /> Questões ilimitadas
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-emerald-600" /> Favoritos
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-emerald-600" /> Histórico de erros
              </li>
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-slate-600">
        Plano anual com parcelamento disponível no checkout.
      </p>
    </section>
  )
}
