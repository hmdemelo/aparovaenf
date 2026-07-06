# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

## Project Status

The Next.js application is initialized at the repository root and fully developed. All core MVP features (student feed, paywall, billing webhooks, author management, layout specifications) and Phase 2 (bulk question import) are implemented, passing all unit, integration, and E2E tests.

## Commands

The standard commands are:

```bash
npm run dev          # Start local dev server
npm run build        # Production build
npm run typecheck    # Type checking (tsc --noEmit)
npm run lint         # ESLint
npm run test         # Vitest unit/integration tests
npm run test:e2e     # Playwright E2E tests
npx supabase start   # Start local Supabase (Postgres + Auth)
npx supabase db push # Apply pending migrations
npx supabase gen types typescript --local > lib/db/database.types.ts  # Regenerate types after schema changes
```

## Architecture

**Stack**: Next.js App Router, TypeScript, React, Tailwind CSS, lucide-react, Supabase Postgres + Supabase Auth, Vercel, Asaas.

**Pattern**: Modular full-stack monolith. Routes are grouped by user surface; business rules live in domain modules under `features/`, never scattered in UI code.

```
app/
  (public)/       # Landing page, terms, privacy
  (student)/      # Feed, favorites, error history
  (author)/       # Question management panel
  (admin)/        # Admin dashboard
  api/            # Route handlers (server-side only)
features/
  admin/          # Bulk import parser, services, dialogs, provisioning
  questions/      # Question repository and validation
  trial/          # Trial counting rules and signup gate
  billing/        # Plans, subscription service, paywall, Asaas checkout
  authors/        # Author question service, permissions, editor
  student-feed/   # Feed shell, question card, answer feedback, favorites/errors
  analytics/      # Product event service
lib/
  auth/           # Role helpers, session
  db/             # Supabase server and browser clients
  env/            # Startup env validation
  security/       # Shared security utilities
supabase/
  migrations/     # Versioned SQL; source of truth for schema
  seed.sql
tests/
  unit/
  integration/    # Use Supabase local, not mocks
  e2e/            # Playwright; covers critical business flows
```

## Core Business Rules

**Trial system** (enforced server-side):
- The feed is login-only: anonymous visitors are redirected to signup before seeing or answering any question.
- Registered non-subscribers: 3 free questions.
- Only answered questions consume trial — viewing does not.
- After trial ends, non-subscribers cannot review trial questions.

**Subscription**:
- Plans: monthly R$ 29,90 and annual R$ 287,00.
- Billing provider is **Asaas** (hosted Checkout, `POST /v3/checkouts`). Card uses `chargeTypes: RECURRENT` with a MONTHLY/YEARLY cycle (Asaas auto-bills the card); PIX uses `chargeTypes: DETACHED` — a one-time payment that prepays the plan period, so PIX access simply expires at `current_period_end`. Amounts are sent in decimal reais and `externalReference` carries the local subscription UUID for webhook correlation.
- Subscription is activated **only** by the token-authenticated Asaas webhook (`asaas-access-token` header) — never based on browser return. Card activates on `PAYMENT_CONFIRMED`; PIX activates on `PAYMENT_RECEIVED` (card `PAYMENT_RECEIVED` is the ~32-day funds settlement and must not re-activate).
- Webhook processing must be idempotent; use `provider_event_id` as the uniqueness key in `PaymentEvent`.
- There is no billing portal: cancellation goes through `POST /api/billing/cancel`, which deletes the Asaas subscription and keeps access until the paid period ends.

**Favorites and history**: persist only for active subscribers. Non-subscriber attempts generate a `favorite_attempted` product event and show a subscription prompt.

**Content**: general comment on every question is required for publication. Alternative-level comments are optional and author-controlled. Questions must have at least two alternatives and exactly one marked correct.

**Author ownership**: authors can only edit their own questions. Admins can unpublish any question.

## Data Model Summary

Key entities: `UserProfile` (roles: `student`, `author`, `admin`), `AuthorProfile`, `Career`, `Board`, `Subject`, `Question`, `Alternative`, `AnswerAttempt`, `Favorite`, `Subscription`, `PaymentEvent`, `ProductEvent`.

`AnswerAttempt.anonymous_session_id` is legacy (pre-2026-07 anonymous trial); new attempts always carry `user_id`. `Question.status` transitions: `draft → published ↔ unpublished`, any state `→ archived`.

After any schema change, regenerate TypeScript types with the Supabase CLI. Never use `select *` in feed or admin listing queries. Index `career_id`, `board_id`, `subject_id`, `difficulty`, `status`, and `author_id` on the questions table.

## Security Constraints

- Row Level Security must be enabled on all tables with user, content, or payment data.
- Supabase service role and Asaas secrets must never reach browser code — server-side only.
- Auth tokens must not be stored in `localStorage`.
- Validate required env vars at startup via `lib/env/server.ts`.
- Only prefix truly public vars with `NEXT_PUBLIC_`.

## Development Workflow

This project uses **Spec Kit** (`.specify/`) for specification management and an ECC/TDD workflow:

1. Spec Kit artifacts in `specs/001-aprovaenf-mvp/` define scope — read `spec.md`, `plan.md`, and `tasks.md` before implementing a feature.
2. For each task: write failing tests first, implement minimum behavior, refactor, then pass `build → typecheck → lint → test` gates.
3. A security review is mandatory before real authentication, payments, or public production launch (task T091).
4. Environments: local Supabase for dev, Vercel Preview for build/UI validation, one Supabase Pro project for production. No isolated staging at first deploy — do not run subscription or payment tests against real production data.

## Analytics Events

The minimum product events that must be recorded (via `features/analytics/product-events.ts`):
`landing_viewed`, `career_selected`, `question_viewed`, `question_answered`, `signup_required_shown`, `signup_completed`, `trial_finished`, `checkout_started`, `subscription_activated`, `favorite_attempted`, `favorite_saved`.

## What Is Out of Scope for the MVP

Native iOS/Android app, Redis, queues, realtime, microsservices, semantic search, AI features, dedicated email provider (Resend), and a separate Supabase staging project.
