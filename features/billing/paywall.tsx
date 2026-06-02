'use client'

import { Check } from 'lucide-react'
import { useState } from 'react'
import { PLAN_LIST, type PlanId } from './plans'

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } }

type CheckoutResponse = {
  checkout_url: string
}

export function Paywall({
  onChoosePlan,
}: {
  onChoosePlan?: (plan: PlanId) => void
}) {
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function startCheckout(plan: PlanId) {
    onChoosePlan?.(plan)
    setLoadingPlan(plan)
    setError(null)

    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const json: ApiEnvelope<CheckoutResponse> = await response.json()

      if (!json.success) {
        setError(
          json.error.code === 'unauthenticated'
            ? 'Entre na sua conta para assinar.'
            : 'Não foi possível iniciar o checkout. Tente novamente.',
        )
        return
      }

      window.location.assign(json.data.checkout_url)
    } catch {
      setError('Não foi possível iniciar o checkout. Tente novamente.')
    } finally {
      setLoadingPlan(null)
    }
  }

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
            <button
              type="button"
              onClick={() => void startCheckout(plan.id)}
              disabled={loadingPlan !== null}
              data-testid={`checkout-${plan.id}`}
              className="mt-auto rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700"
            >
              {loadingPlan === plan.id
                ? 'Abrindo checkout...'
                : `Assinar ${plan.label.toLowerCase()}`}
            </button>
          </div>
        ))}
      </div>

      {error && (
        <p
          className="rounded-lg bg-rose-50 px-4 py-2 text-center text-sm text-rose-700"
          data-testid="checkout-error"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  )
}
