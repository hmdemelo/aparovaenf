# Implementation Plan: Transition from Abacate Pay to Stripe

**Branch**: `006-stripe-migration` | **Date**: 2026-06-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-stripe-migration/spec.md`

## Summary

This plan outlines the removal of the Abacate Pay billing integration and the transition to Stripe Checkout and Subscriptions.
We will:
1. Complete the removal of all Abacate Pay integration code (webhook endpoint, SDK calls, setup scripts, and documentation).
2. Integrate Stripe Checkout Sessions for monthly and annual subscriptions.
3. Configure a secure webhook receiver endpoint at `/api/webhooks/stripe` to handle activation (`checkout.session.completed` / `invoice.paid`), failed renewals (`invoice.payment_failed`), and cancellation (`customer.subscription.deleted`).
4. Maintain a robust developer testing workflow with an explicit local-only mock checkout (keys starting with `stripe_dev_*`) that requires an authenticated owner and never enables unsigned webhooks.

## Technical Context

**Language/Version**: TypeScript / Node.js 20 / Next.js 14 App Router  
**Primary Dependencies**: `stripe` (v14+), `@supabase/supabase-js`  
**Storage**: Supabase Postgres (`subscriptions` table, generic schemas)  
**Testing**: Playwright (E2E), Vitest (Unit/Integration)  
**Target Platform**: Web application (Vercel)  
**Project Type**: Web application  
**Performance Goals**: N/A (standard checkout redirect and webhook processing)  
**Constraints**: Keep database schema unchanged, verify webhook signatures securely, support development mode without real keys.  
**Scale/Scope**: Impacts all subscription purchases and webhook processing.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Mobile-First Learning Value**: PASS. Payment flows remain mobile-responsive as Stripe Checkout is mobile-first.
- **Secure Data Boundaries**: PASS. Stripe secret keys and webhook secrets will be stored in server-side environment variables and never exposed to the client.
- **Test-First Delivery**: PASS. Existing E2E subscription test flows will be modified for Stripe and verified.
- **Simple Modular Architecture**: PASS. The integration resides cleanly inside `features/billing/` and a dedicated webhook route.
- **Observable Operations**: PASS. Webhook payload recording and errors will be logged.

## Project Structure

### Documentation (this feature)

```text
specs/006-stripe-migration/
├── spec.md              # Feature specification
├── plan.md              # This file (Implementation Plan)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
features/billing/
├── subscription-service.ts  # Replace Abacate Pay API with Stripe API
└── payment-event-repository.ts # Stores generic webhook payloads

app/api/
├── billing/checkout/route.ts # Endpoint initiating checkout redirect
└── webhooks/
    └── stripe/              # app/api/webhooks/stripe/route.ts (Stripe webhook)
```

**Structure Decision**: We will use Option 1 (Single project), where the Stripe integration is structured inside Next.js API routes and the `features/billing/` feature folder. We will completely delete `app/api/webhooks/abacate-pay/` and `scripts/setup-abacate-pay.mjs`.

## Complexity Tracking

*No violations detected. Standard billing provider swap.*
