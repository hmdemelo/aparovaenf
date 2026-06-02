/**
 * Subscription plan constants. Prices are confirmed product decisions
 * (constitution): monthly R$ 29,90 and annual R$ 287,00 (parceling allowed).
 * Amounts are in cents to avoid floating-point money bugs.
 */

export type PlanId = 'monthly' | 'annual'

export type PlanInfo = {
  id: PlanId
  label: string
  amountCents: number
  priceLabel: string
  cadenceLabel: string
}

export const PLANS: Record<PlanId, PlanInfo> = {
  monthly: {
    id: 'monthly',
    label: 'Mensal',
    amountCents: 2990,
    priceLabel: 'R$ 29,90',
    cadenceLabel: 'por mês',
  },
  annual: {
    id: 'annual',
    label: 'Anual',
    amountCents: 28700,
    priceLabel: 'R$ 287,00',
    cadenceLabel: 'por ano',
  },
}

export const PLAN_LIST: PlanInfo[] = [PLANS.monthly, PLANS.annual]
