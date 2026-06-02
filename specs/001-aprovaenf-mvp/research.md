# Research: aprovaenf MVP

## Decision: Use a modular Next.js monolith

**Rationale**: The expected launch scale is about 100 users and 500 users in the
next month. A single Next.js app can serve landing, student app, author panel,
admin panel, and server endpoints without operational overhead.

**Alternatives considered**:

- Separate frontend/backend: rejected because it increases deployment and auth
  complexity before the product validates.
- Microsservices: rejected as premature.

## Decision: Use Supabase Postgres and Supabase Auth

**Rationale**: Supabase provides Postgres, Auth, RLS, migrations, local
development, and generated TypeScript types. This matches the security and data
needs of the MVP without adding ORM complexity.

**Alternatives considered**:

- Prisma/Drizzle immediately: rejected for MVP to keep the stack smaller.
- Custom auth: rejected due to avoidable security risk and delivery cost.

## Decision: Use Supabase Pro for the first production database

**Rationale**: The user selected Supabase Pro. It is appropriate for backup and
operational needs at the expected early scale.

**Alternatives considered**:

- Free plan: rejected because the product is production-facing and needs better
  operational guarantees.
- Separate staging database now: rejected by product decision for the first
  deploy.

## Decision: No separate Supabase staging on first deploy

**Rationale**: The team will use Supabase local for database tests and Vercel
Preview for build/UI/controlled-flow validation. This keeps cost and operations
lighter during the first launch.

**Risk control**:

- Do not test payment/subscription mutations with real production users.
- Use local Supabase for migration and seed validation.
- Add isolated staging later when production traffic or team size justifies it.

## Decision: Use Abacate Pay server-side integration

**Rationale**: Abacate Pay is the chosen payment provider. Checkout must start
from server-side endpoints, and subscription unlock must depend on verified
server-side webhook processing.

**Alternatives considered**:

- Browser return unlock: rejected as insecure.
- Manual activation: rejected except as admin emergency operation.

## Decision: Use Vercel Observability plus internal product events

**Rationale**: Vercel and Supabase cover early operational visibility, while an
internal product event table captures funnel-specific business questions.

**Alternatives considered**:

- Full analytics suite: rejected for MVP complexity.
- Sentry immediately: optional later if runtime logs are insufficient.

## Decision: TDD with Vitest and Playwright

**Rationale**: Trial, payment, and content publishing rules are business-critical.
Unit/integration tests protect rules, and Playwright validates user journeys.

**Alternatives considered**:

- Manual QA only: rejected because payment/trial regressions are too costly.
