'use client'

import { Check, CreditCard, QrCode, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { PLAN_LIST, type PlanId } from './plans'

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } }

type CheckoutResponse = {
  checkout_url: string
}

const DEFAULT_TITLE = 'Você concluiu as questões gratuitas'
const DEFAULT_DESCRIPTION =
  'Assine para continuar resolvendo questões sem limite, salvar favoritos e revisar seus erros.'

export function Paywall({
  onChoosePlan,
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
}: {
  onChoosePlan?: (plan: PlanId) => void
  title?: string
  description?: string
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
    <div className="aprova-study-card flex flex-col gap-5 p-6" data-testid="paywall">
      <div className="text-center">
        <span className="mx-auto mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[rgba(160,243,212,0.42)] text-[var(--teal)]">
          <Sparkles size={21} />
        </span>
        <h2 className="font-display text-[24px] font-semibold leading-tight text-[var(--ink)]">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          {description}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {PLAN_LIST.map((plan) => (
          <div
            key={plan.id}
            className={`flex flex-col gap-4 rounded-[22px] p-5 ${
              plan.id === 'annual'
                ? 'bg-[var(--teal)] text-white'
                : 'border border-[color:var(--line)] bg-white'
            }`}
          >
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
              <p className="font-display mt-1 text-[25px] font-semibold">
                {plan.label}
              </p>
              <p className="font-display mt-3 text-[30px] font-semibold leading-none">
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
                  {plan.id === 'annual' ? 'PIX ou Cartão (até 12x)' : 'PIX ou Cartão'}
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
            <button
              type="button"
              onClick={() => void startCheckout(plan.id)}
              disabled={loadingPlan !== null}
              data-testid={`checkout-${plan.id}`}
              className={`mt-auto flex items-center justify-center gap-2 rounded-[16px] px-4 py-3 font-semibold transition active:scale-[0.98] disabled:opacity-70 ${
                plan.id === 'annual'
                  ? 'bg-[var(--mint-strong)] text-[var(--teal-ink)] hover:brightness-105'
                  : 'bg-[var(--teal)] text-white hover:bg-[var(--teal-mid)]'
              }`}
            >
              <QrCode size={16} />
              <span className="opacity-60 text-xs">/</span>
              <CreditCard size={16} />
              {loadingPlan === plan.id
                ? 'Abrindo checkout...'
                : `Assinar ${plan.label.toLowerCase()}`}
            </button>
          </div>
        ))}
      </div>

      {error && (
        <p
          className="rounded-[var(--radius-sm)] bg-[var(--danger-bg)] px-4 py-2 text-center text-sm text-[var(--danger)]"
          data-testid="checkout-error"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  )
}
