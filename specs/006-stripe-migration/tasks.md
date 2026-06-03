# Tasks: Transition from Abacate Pay to Stripe

**Input**: Design documents from `/specs/006-stripe-migration/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: Update E2E test suite to verify Stripe flow.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Install Stripe Node SDK (`npm install stripe`)
- [ ] T002 Update environment schema and example files in `lib/env/server.ts`, `.env.example`, and `.env.local` to define Stripe secret keys and product/price IDs

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 Replace Abacate Pay API logic with Stripe Checkout Session creation in `features/billing/subscription-service.ts`
- [ ] T004 Create Stripe Webhook endpoint at `app/api/webhooks/stripe/route.ts` with signature verification and database events handler
- [ ] T005 Delete Abacate Pay Webhook route folder `app/api/webhooks/abacate-pay/` and helper script `scripts/setup-abacate-pay.mjs`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Checkout with Stripe (Priority: P1) 🎯 MVP

**Goal**: Student clicks subscription button and redirects to Stripe Checkout.

**Independent Test**: Click checkout on local paywall, verify redirect to mock checkout URL, and inspect params.

### Implementation for User Story 1

- [ ] T006 [US1] Update pricing visual indicators and paywall card buttons in `features/billing/paywall.tsx` to align with Stripe Checkout
- [ ] T007 [US1] Update mock banner and simulated payment server action in `app/(public)/page.tsx` to handle Stripe payload structure

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Automated Subscription Activation via Webhook (Priority: P1)

**Goal**: Stripe webhook triggers local subscription activation and feed unlock.

**Independent Test**: Run E2E test to verify webhook-based unlock.

### Implementation for User Story 2

- [ ] T008 [US2] Update subscription E2E tests in `tests/e2e/subscription-unlock.spec.ts` to mock Stripe Checkout and post simulated Stripe events to the new webhook

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T009 Run all unit, integration, and E2E tests to ensure no regressions
- [ ] T010 Commit changes to the feature branch

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable

### Within Each User Story

- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Update styling/view components and mock page actions in parallel:
Task: "Update pricing visual indicators and paywall card buttons in features/billing/paywall.tsx"
Task: "Update mock banner and simulated payment server action in app/(public)/page.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
