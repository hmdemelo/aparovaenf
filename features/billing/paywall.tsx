'use client'

import { Check, CreditCard, QrCode, Sparkles } from 'lucide-react'
import { useState } from 'react'
import type { PaymentMethod } from '@/lib/validation/schemas'
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
  const [loadingCheckout, setLoadingCheckout] = useState<{
    plan: PlanId
    method: PaymentMethod
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function startCheckout(plan: PlanId, method: PaymentMethod) {
    onChoosePlan?.(plan)
    setLoadingCheckout({ plan, method })
    setError(null)

    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, payment_method: method }),
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
      setLoadingCheckout(null)
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
                  Cartão ou PIX
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
            <div className="mt-auto flex flex-col gap-2">
              <button
                type="button"
                onClick={() => void startCheckout(plan.id, 'card')}
                disabled={loadingCheckout !== null}
                data-testid={`checkout-${plan.id}`}
                className={`flex items-center justify-center gap-2 rounded-[16px] px-4 py-3 font-semibold transition active:scale-[0.98] disabled:opacity-70 ${
                  plan.id === 'annual'
                    ? 'bg-[var(--mint-strong)] text-[var(--teal-ink)] hover:brightness-105'
                    : 'bg-[var(--teal)] text-white hover:bg-[var(--teal-mid)]'
                }`}
              >
                <CreditCard size={16} />
                {loadingCheckout?.plan === plan.id &&
                loadingCheckout.method === 'card'
                  ? 'Abrindo checkout...'
                  : `Assinar ${plan.label.toLowerCase()}`}
              </button>
              <button
                type="button"
                onClick={() => void startCheckout(plan.id, 'pix')}
                disabled={loadingCheckout !== null}
                data-testid={`checkout-${plan.id}-pix`}
                className={`flex items-center justify-center gap-2 rounded-[16px] border px-4 py-3 font-semibold transition active:scale-[0.98] disabled:opacity-70 ${
                  plan.id === 'annual'
                    ? 'border-white/40 text-white hover:bg-white/10'
                    : 'border-[color:var(--teal)] text-[var(--teal)] hover:bg-[rgba(160,243,212,0.18)]'
                }`}
              >
                <QrCode size={16} />
                {loadingCheckout?.plan === plan.id &&
                loadingCheckout.method === 'pix'
                  ? 'Abrindo checkout...'
                  : 'Pagar com PIX'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-[var(--muted)]">
        O pagamento via PIX é avulso: libera o período do plano de uma vez e
        não renova automaticamente.
      </p>

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
