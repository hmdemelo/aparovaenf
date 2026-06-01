# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

The application has not been initialized yet. The repository currently holds prototypes (`index.html`, `aprovaenf-prototipo.html`), brand assets, and Spec Kit planning artifacts (`specs/001-aprovaenf-mvp/`). The Next.js application will be created at the repository root as part of task T001.

## Commands

Once the Next.js app is initialized, the standard commands will be:

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

**Stack**: Next.js App Router, TypeScript, React, Tailwind CSS, lucide-react, Supabase Postgres + Supabase Auth, Vercel, Abacate Pay.

**Pattern**: Modular full-stack monolith. Routes are grouped by user surface; business rules live in domain modules under `features/`, never scattered in UI code.

```
app/
  (public)/       # Landing page, terms, privacy
  (student)/      # Feed, favorites, error history
  (author)/       # Question management panel
  (admin)/        # Admin dashboard
  api/            # Route handlers (server-side only)
features/
  questions/      # Question repository and validation
  trial/          # Trial counting rules and signup gate
  billing/        # Plans, subscription service, paywall, Abacate Pay checkout
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
- Anonymous visitors: 2 answered questions before signup is required.
- Registered non-subscribers: 3 more free questions after signup (5 total).
- Only answered questions consume trial — viewing does not.
- After trial ends, non-subscribers cannot review trial questions.

**Subscription**:
- Plans: monthly R$ 29,90 and annual R$ 287,00 (parceling allowed).
- Subscription is activated **only** after server-side webhook confirmation from Abacate Pay — never based on browser return.
- Webhook processing must be idempotent; use `provider_event_id` as the uniqueness key in `PaymentEvent`.

**Favorites and history**: persist only for active subscribers. Non-subscriber attempts generate a `favorite_attempted` product event and show a subscription prompt.

**Content**: general comment on every question is required for publication. Alternative-level comments are optional and author-controlled. Questions must have at least two alternatives and exactly one marked correct.

**Author ownership**: authors can only edit their own questions. Admins can unpublish any question.

## Data Model Summary

Key entities: `UserProfile` (roles: `student`, `author`, `admin`), `AuthorProfile`, `Career`, `Board`, `Subject`, `Question`, `Alternative`, `AnswerAttempt`, `Favorite`, `Subscription`, `PaymentEvent`, `ProductEvent`.

`AnswerAttempt` supports anonymous attempts via `anonymous_session_id` before signup. `Question.status` transitions: `draft → published ↔ unpublished`, any state `→ archived`.

After any schema change, regenerate TypeScript types with the Supabase CLI. Never use `select *` in feed or admin listing queries. Index `career_id`, `board_id`, `subject_id`, `difficulty`, `status`, and `author_id` on the questions table.

## Security Constraints

- Row Level Security must be enabled on all tables with user, content, or payment data.
- Supabase service role and Abacate Pay secrets must never reach browser code — server-side only.
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
