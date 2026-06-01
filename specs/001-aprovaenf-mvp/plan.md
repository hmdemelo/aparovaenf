# Implementation Plan: aprovaenf MVP

**Branch**: `001-aprovaenf-mvp` | **Date**: 2026-06-01 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/001-aprovaenf-mvp/spec.md`

## Summary

Build the first production version of aprovaenf as a responsive web platform for
concursos da saude question practice. The MVP includes landing, trial feed,
signup gate, subscription/paywall via Abacate Pay, author question management,
admin operations, subscriber favorites/error history, and basic analytics.

Implementation approach: modular Next.js monolith with Supabase Postgres/Auth,
RLS, TypeScript, Vercel deploy, TDD-first delivery, and E2E verification of the
critical business flows.

## Technical Context

**Language/Version**: TypeScript on current LTS Node runtime  
**Primary Dependencies**: Next.js App Router, React, Tailwind CSS, lucide-react,
Supabase JS client, Zod, Vitest, Playwright  
**Storage**: Supabase Postgres on Supabase Pro  
**Testing**: Vitest for unit/integration, Playwright for E2E, Supabase local for
database integration where needed  
**Target Platform**: Vercel web deployment, modern mobile/desktop browsers  
**Project Type**: Full-stack web application  
**Performance Goals**: First question reachable from landing in under 30
seconds; feed interaction without full page reload; support 100 launch users and
500 next-month users without extra infrastructure  
**Constraints**: No separate Supabase staging at first deploy; no Redis, queues,
microsservices, native app, realtime, semantic search, or IA in MVP  
**Scale/Scope**: Text-only content; Enfermagem and Tecnico em enfermagem launch
careers; approximately 6 primary product areas

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Mobile-first learning value: PASS. The first deliverable is the student
  question loop and trial conversion path.
- Secure data boundaries: PASS. Auth, RLS, server-side subscription activation,
  and webhook idempotency are foundational tasks.
- Test-first delivery: PASS. Tasks require tests before implementation for
  critical flows.
- Simple modular architecture: PASS. Plan uses one modular monolith and rejects
  non-MVP infrastructure.
- Observable operations: PASS. Product events, payment logs, and admin metrics
  are planned.

## Project Structure

### Documentation (this feature)

```text
specs/001-aprovaenf-mvp/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── api.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
app/
├── (public)/
├── (student)/
├── (author)/
├── (admin)/
└── api/

components/
features/
├── analytics/
├── authors/
├── billing/
├── questions/
├── student-feed/
└── trial/

lib/
├── auth/
├── db/
├── env/
└── security/

supabase/
├── migrations/
└── seed.sql

tests/
├── e2e/
├── integration/
└── unit/
```

**Structure Decision**: Use Next.js App Router at the repository root. Group
routes by user surface and business logic by domain under `features/`. Keep DB,
auth, env, and security utilities in `lib/`.

## Phase 0: Research

Research is captured in [research.md](./research.md). All technical choices from
the planning stage are resolved.

## Phase 1: Design & Contracts

- Data model: [data-model.md](./data-model.md)
- API/UI contracts: [contracts/api.md](./contracts/api.md)
- Quickstart validation: [quickstart.md](./quickstart.md)

## Phase 2: Execution Strategy

1. Initialize the Next.js app only after Spec Kit tasks are accepted.
2. Build foundation first: env validation, Supabase local, migrations, auth/RLS,
   role model, test framework, visual base.
3. Deliver independently testable user stories in priority order:
   - US1: student trial feed and paywall.
   - US2: author question publishing.
   - US3: subscription activation.
   - US4: favorites and error history.
   - US5: admin operations and metrics.
   - US6: landing and public pages.
4. Run verification after each story: build, typecheck, lint, tests, E2E smoke.
5. Before production: security review, payment webhook verification, backup,
   terms/privacy, analytics, and controlled preview validation.

## Complexity Tracking

No constitution violations identified.
