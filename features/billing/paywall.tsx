'use client'

import { Check } from 'lucide-react'
import { PLAN_LIST } from './plans'

/**
 * Shown after the 5 free questions are used. Presents the monthly and annual
 * plans. Checkout wiring (Abacate Pay) is delivered in US3; for now the CTA is
 * a placeholder the paywall renders so the trial gate is complete.
 */
export function Paywall({ onChoosePlan }: { onChoosePlan?: (plan: string) => void }) {
  return (
    <div className="flex flex-col gap-5" data-testid="paywall">
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-900">
          Você concluiu as questões gratuitas
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Assine para continuar resolvendo questões sem limite, salvar favoritos
          e revisar seus erros.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {PLAN_LIST.map((plan) => (
          <div
            key={plan.id}
            className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5"
          >
            <div>
              <p className="text-sm font-semibold text-slate-500">{plan.label}</p>
              <p className="text-2xl font-bold text-slate-900">{plan.priceLabel}</p>
              <p className="text-xs text-slate-400">{plan.cadenceLabel}</p>
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
            <button
              type="button"
              onClick={() => onChoosePlan?.(plan.id)}
              className="mt-auto rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700"
            >
              Assinar {plan.label.toLowerCase()}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
