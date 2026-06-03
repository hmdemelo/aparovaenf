# Implementation Plan: Pix support indicators in pricing and checkout UI

**Branch**: `005-pix-checkout-ui` | **Date**: 2026-06-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-pix-checkout-ui/spec.md`

## Summary

This plan outlines the UI adjustments to clearly communicate to users which payment methods are accepted for each plan:
- **Monthly Plan**: Only Credit Card is accepted (due to automatic recurrence constraints on the provider side).
- **Annual Plan**: Both PIX and Credit Card (with up to 12 installments) are accepted.

The modifications will be visual-only and located in `features/billing/paywall.tsx` (the paywall shown after trial ends) and `features/billing/pricing-section.tsx` (the landing page pricing cards).

## Technical Context

**Language/Version**: TypeScript / Node.js 20 / Next.js 14 App Router  
**Primary Dependencies**: React, Tailwind CSS, Lucide icons  
**Storage**: N/A (no database changes)  
**Testing**: Playwright (E2E), Jest (Unit/Integration)  
**Target Platform**: Web application (Vercel deployment)
**Project Type**: Web application  
**Performance Goals**: N/A (standard UI rendering, no degradation)  
**Constraints**: Keep UI consistent with existing styling and HSL tailored colors.  
**Scale/Scope**: Impacts all students hitting the paywall and visitors reading pricing.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Mobile-First Learning Value**: PASS. Clear payment indicators reduce friction for mobile students subscribing.
- **Secure Data Boundaries**: PASS. No payment keys or webhook keys are modified or exposed.
- **Test-First Delivery**: PASS. Existing E2E subscription flows will be run to verify no regression.
- **Simple Modular Architecture**: PASS. Purely modular frontend changes in the billing feature.
- **Observable Operations**: PASS. No new backend operations are introduced.

## Project Structure

### Documentation (this feature)

```text
specs/005-pix-checkout-ui/
├── spec.md              # Feature specification
├── plan.md              # This file (Implementation Plan)
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Task list
```

### Source Code

```text
features/billing/
├── paywall.tsx          # Modify: Add PIX indicator, installment note, adjust Monthly card
└── pricing-section.tsx  # Modify: Add badges for PIX/Card, adjust bottom disclaimers
```

**Structure Decision**: Option A modifies existing files in `features/billing/` to keep frontend UI components co-located with their logic.

## Verification Plan

### Automated Tests
- Run existing unit tests for pricing: `npm test tests/unit/pricing-section.test.ts`
- Run existing E2E tests for subscription: `npx playwright test tests/e2e/subscription-unlock.spec.ts`
- Run all tests to guarantee no regression: `npm test`

### Manual Verification
- Visual inspection of the landing page pricing cards at `http://localhost:3000/`.
- Visual inspection of the paywall at `http://localhost:3000/feed` (by logging in as a non-subscriber student and answering 3 questions to trigger the paywall).
- Verify the layout remains mobile-friendly.
