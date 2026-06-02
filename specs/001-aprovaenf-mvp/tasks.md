# Tasks: aprovaenf MVP

**Input**: Design documents from `/specs/001-aprovaenf-mvp/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, quickstart.md  
**Tests**: Required by ECC/TDD for critical user stories.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the real application and shared tooling.

- [x] T001 Initialize Next.js app with TypeScript in `/Users/hugo/projetos/aprovaenf`
- [x] T002 Configure Tailwind CSS in `tailwind.config.ts` and `app/globals.css`
- [x] T003 [P] Configure ESLint and formatting scripts in `package.json`
- [x] T004 [P] Configure Vitest in `vitest.config.ts`
- [x] T005 [P] Configure Playwright in `playwright.config.ts`
- [x] T006 Create `.env.example` with Supabase, Abacate Pay, and app URL placeholders
- [x] T007 Create app route groups in `app/(public)`, `app/(student)`, `app/(author)`, `app/(admin)`, and `app/api`
- [x] T008 Create feature folders in `features/questions`, `features/trial`, `features/billing`, `features/authors`, `features/student-feed`, and `features/analytics`
- [x] T009 Create shared folders in `components`, `lib/auth`, `lib/db`, `lib/env`, and `lib/security`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST complete before user stories.

- [x] T010 Write env validation tests in `tests/unit/env.test.ts`
- [x] T011 Implement env validation in `lib/env/server.ts`
- [x] T012 Create Supabase migration for core enums and reference tables in `supabase/migrations/001_core.sql`
- [x] T013 Create Supabase migration for users, authors, questions, alternatives, answers, favorites, subscriptions, payment events, and product events in `supabase/migrations/002_mvp_schema.sql`
- [x] T014 Create RLS policies for student-owned data, author-owned questions, and admin access in `supabase/migrations/003_rls_policies.sql`
- [x] T015 [P] Create Supabase client helpers in `lib/db/server.ts` and `lib/db/browser.ts`
- [x] T016 [P] Create auth role helpers in `lib/auth/roles.ts`
- [x] T017 [P] Create API response envelope helpers in `lib/api/response.ts`
- [x] T018 [P] Create Zod schemas for shared validation in `lib/validation/schemas.ts`
- [x] T019 Seed careers, priority boards, subjects, and demo author users in `supabase/seed.sql`
- [x] T020 Create product event service tests in `tests/unit/product-events.test.ts`
- [x] T021 Implement product event service in `features/analytics/product-events.ts`
- [x] T022 Run local migration and seed validation with Supabase local

**Checkpoint**: Foundation ready; user stories can start.

---

## Phase 3: User Story 1 - Student completes trial learning loop (Priority: P1)

**Goal**: Visitor answers 2 questions, signs up, answers 3 more, then sees paywall.

**Independent Test**: Playwright flow from landing to paywall.

### Tests

- [x] T023 [P] [US1] Write unit tests for trial counting in `tests/unit/trial-rules.test.ts`
- [x] T024 [P] [US1] Write integration tests for next-question and answer submission in `tests/integration/student-feed.test.ts`
- [x] T025 [P] [US1] Write E2E test for visitor-to-paywall flow in `tests/e2e/student-trial.spec.ts`

### Implementation

- [x] T026 [P] [US1] Implement trial rule service in `features/trial/trial-service.ts`
- [x] T027 [P] [US1] Implement feed question repository in `features/questions/question-repository.ts`
- [x] T028 [US1] Implement next-question route in `app/api/feed/next/route.ts`
- [x] T029 [US1] Implement answer submission route in `app/api/answers/route.ts`
- [x] T030 [US1] Implement trial status route in `app/api/trial/status/route.ts`
- [x] T031 [US1] Build mobile-first question card in `features/student-feed/question-card.tsx`
- [x] T032 [US1] Build feedback/comment panel in `features/student-feed/answer-feedback.tsx`
- [x] T033 [US1] Build swipe/next navigation behavior in `features/student-feed/feed-shell.tsx`
- [x] T034 [US1] Build signup gate UI in `features/trial/signup-gate.tsx`
- [x] T035 [US1] Build paywall UI in `features/billing/paywall.tsx`
- [x] T036 [US1] Wire student feed route in `app/(student)/feed/page.tsx`
- [x] T037 [US1] Record `career_selected`, `question_viewed`, `question_answered`, `signup_required_shown`, and `trial_finished`

**Checkpoint**: Student trial loop is independently demoable.

---

## Phase 4: User Story 2 - Author publishes commented questions (Priority: P1)

**Goal**: Author can create, validate, edit, and publish question content.

**Independent Test**: Author creates a question, publish fails without general
comment, then succeeds with a valid question.

### Tests

- [x] T038 [P] [US2] Write unit tests for question publish validation in `tests/unit/question-validation.test.ts`
- [x] T039 [P] [US2] Write integration tests for author question routes in `tests/integration/author-questions.test.ts`
- [x] T040 [P] [US2] Write E2E test for author publishing in `tests/e2e/author-publish.spec.ts`

### Implementation

- [x] T041 [P] [US2] Implement question validation in `features/questions/question-validation.ts`
- [x] T042 [P] [US2] Implement author question service in `features/authors/author-question-service.ts`
- [x] T043 [US2] Implement author question list route in `app/api/author/questions/route.ts`
- [x] T044 [US2] Implement author question detail update route in `app/api/author/questions/[id]/route.ts`
- [x] T045 [US2] Implement publish route in `app/api/author/questions/[id]/publish/route.ts`
- [x] T046 [US2] Build author question list page in `app/(author)/author/questions/page.tsx`
- [x] T047 [US2] Build question editor form in `features/authors/question-editor.tsx`
- [x] T048 [US2] Build variable alternatives editor in `features/authors/alternatives-editor.tsx`
- [x] T049 [US2] Enforce author ownership checks in `features/authors/author-permissions.ts`

**Checkpoint**: Author content pipeline is independently demoable.

---

## Phase 5: User Story 3 - Subscriber unlocks paid access (Priority: P1)

**Goal**: Trial-ended user can start checkout and subscription unlocks only via webhook.

**Independent Test**: Simulated Abacate Pay webhook activates subscription and
unlocks feed.

### Tests

- [x] T050 [P] [US3] Write unit tests for subscription access rules in `tests/unit/subscription-rules.test.ts`
- [x] T051 [P] [US3] Write integration tests for checkout route in `tests/integration/billing-checkout.test.ts`
- [x] T052 [P] [US3] Write integration tests for webhook idempotency in `tests/integration/abacate-webhook.test.ts`
- [x] T053 [P] [US3] Write E2E paywall-to-unlock smoke in `tests/e2e/subscription-unlock.spec.ts`

### Implementation

- [x] T054 [P] [US3] Implement billing plan constants in `features/billing/plans.ts`
- [x] T055 [P] [US3] Implement subscription service in `features/billing/subscription-service.ts`
- [x] T056 [US3] Implement checkout route in `app/api/billing/checkout/route.ts`
- [x] T057 [US3] Implement Abacate Pay webhook route in `app/api/webhooks/abacate-pay/route.ts`
- [x] T058 [US3] Implement payment event repository in `features/billing/payment-event-repository.ts`
- [x] T059 [US3] Add paywall checkout actions to `features/billing/paywall.tsx`
- [x] T060 [US3] Record `checkout_started` and `subscription_activated` events

**Checkpoint**: Paid access unlock is independently demoable.

---

## Phase 6: User Story 4 - Subscriber uses retention features (Priority: P2)

**Goal**: Subscribers can save favorites and review errors; non-subscribers cannot persist favorites.

**Independent Test**: Subscriber favorite persists; non-subscriber favorite does not.

### Tests

- [x] T061 [P] [US4] Write unit tests for favorite permission rules in `tests/unit/favorite-rules.test.ts`
- [x] T062 [P] [US4] Write integration tests for favorite routes in `tests/integration/favorites.test.ts`
- [x] T063 [P] [US4] Write E2E test for subscriber favorites and errors in `tests/e2e/subscriber-retention.spec.ts`

### Implementation

- [x] T064 [P] [US4] Implement favorites service in `features/student-feed/favorites-service.ts`
- [x] T065 [P] [US4] Implement error history service in `features/student-feed/error-history-service.ts`
- [x] T066 [US4] Implement favorites routes in `app/api/favorites/route.ts` and `app/api/favorites/[questionId]/route.ts`
- [x] T067 [US4] Build favorites page in `app/(student)/favorites/page.tsx`
- [x] T068 [US4] Build error history page in `app/(student)/errors/page.tsx`
- [x] T069 [US4] Add favorite button behavior to `features/student-feed/question-card.tsx`

---

## Phase 7: User Story 5 - Admin operates the platform (Priority: P2)

**Goal**: Admin can inspect users/questions, unpublish content, and view metrics.

**Independent Test**: Admin unpublishes a question and sees it removed from feed.

### Tests

- [x] T070 [P] [US5] Write integration tests for admin routes in `tests/integration/admin.test.ts`
- [x] T071 [P] [US5] Write E2E test for admin moderation in `tests/e2e/admin-moderation.spec.ts`

### Implementation

- [x] T072 [P] [US5] Implement admin permission guard in `features/admin/admin-permissions.ts`
- [x] T073 [P] [US5] Implement admin metrics service in `features/admin/admin-metrics-service.ts`
- [x] T074 [US5] Implement admin users route in `app/api/admin/users/route.ts`
- [x] T075 [US5] Implement admin questions route in `app/api/admin/questions/route.ts`
- [x] T076 [US5] Implement admin unpublish route in `app/api/admin/questions/[id]/unpublish/route.ts`
- [x] T077 [US5] Implement admin metrics route in `app/api/admin/metrics/route.ts`
- [x] T078 [US5] Build admin dashboard in `app/(admin)/admin/page.tsx`

---

## Phase 8: User Story 6 - Public landing converts visitors (Priority: P3)

**Goal**: Landing explains the offer, authors, pricing, and starts trial.

**Independent Test**: Visitor understands the product and starts the feed.

### Tests

- [x] T079 [P] [US6] Write E2E landing-to-first-question test in `tests/e2e/landing.spec.ts`
- [x] T080 [P] [US6] Write accessibility smoke test for landing and feed in `tests/e2e/accessibility.spec.ts`

### Implementation

- [x] T081 [P] [US6] Convert prototype visual tokens into `app/globals.css`
- [x] T082 [US6] Build public landing page in `app/(public)/page.tsx`
- [x] T083 [US6] Build author trust section in `features/authors/public-authors.tsx`
- [x] T084 [US6] Build pricing section with R$ 29,90 and R$ 287,00 in `features/billing/pricing-section.tsx`
- [x] T085 [US6] Create terms page in `app/(public)/termos/page.tsx`
- [x] T086 [US6] Create privacy page in `app/(public)/privacidade/page.tsx`
- [x] T087 [US6] Configure metadata, Open Graph, and favicon in `app/layout.tsx`

---

## Phase 9: Polish & Production Readiness

- [ ] T088 [P] Update docs with implemented behavior in `docs/aprovaenf-produto-mvp.md`
- [ ] T089 [P] Add README setup and verification guide in `README.md`
- [x] T090 Run full verification: typecheck, lint, unit, integration, E2E, build
- [x] T091 Run security review for auth, RLS, Abacate Pay secrets, webhook, and admin routes
- [ ] T092 Configure Vercel production environment variables
- [ ] T093 Configure Supabase Pro production project and backup settings
- [ ] T094 Configure Abacate Pay production plans and webhook URL
- [ ] T095 Validate Vercel Preview with controlled flows only
- [ ] T096 Deploy production and run post-deploy smoke from quickstart

## Dependencies & Execution Order

- Phase 1 -> Phase 2 -> user stories.
- US1, US2, and US3 are all P1, but recommended order is US1 -> US2 -> US3.
- US4 depends on US3 for active subscriber behavior.
- US5 can start after Phase 2 and should be ready before launch.
- US6 can run in parallel after visual tokens are extracted.
- Phase 9 depends on all launch-scope user stories.

## Parallel Opportunities

- Setup configuration tasks marked [P] can run together.
- Foundational service/helper tasks marked [P] can run together after migrations
  are drafted.
- Tests for each user story can be written in parallel before implementation.
- US2 author UI and US3 billing services can progress in parallel after Phase 2.
- US6 public landing can progress alongside backend-heavy stories.

## Implementation Strategy

1. Complete foundation and seed enough sample content.
2. Deliver US1 as the first demoable MVP slice.
3. Add US2 so real authors can create content.
4. Add US3 so conversion can be tested.
5. Add subscriber/admin/public polish.
6. Verify, secure, configure production, and deploy.
