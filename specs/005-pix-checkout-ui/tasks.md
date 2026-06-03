# Tasks: Pix support indicators in pricing and checkout UI

**Input**: Design documents from `/specs/005-pix-checkout-ui/`
**Prerequisites**: plan.md (required), spec.md (required)

**Tests**: Tests are run as validation steps for each user story.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: None required for this UI-only feature.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: None required for this UI-only feature.

---

## Phase 3: User Story 1 - Clear pricing details on landing page (Priority: P1) 🎯 MVP

**Goal**: Clear payment method indicators for both Monthly (Credit Card only) and Annual (PIX + Card up to 12x) on the landing page pricing cards.

**Independent Test**: Visit the landing page at `http://localhost:3000/` and verify the Monthly card specifies card-only, and the Annual card highlights PIX/Card and installments.

### Implementation for User Story 1

- [ ] T001 [P] [US1] Add Credit Card-only indicator to Monthly plan card in features/billing/pricing-section.tsx
- [ ] T002 [P] [US1] Add PIX and Card badge/indicator to Annual plan card in features/billing/pricing-section.tsx
- [ ] T003 [US1] Update the bottom disclaimer text in features/billing/pricing-section.tsx
- [ ] T004 [US1] Run unit tests for pricing section in tests/unit/pricing-section.test.ts

**Checkpoint**: User Story 1 is fully functional and visually verified.

---

## Phase 4: User Story 2 - Informed choice on paywall screen (Priority: P1)

**Goal**: Explicitly show allowed payment methods inside the paywall cards, and update checkout buttons with appropriate payment method icons/text.

**Independent Test**: Log in with a non-subscriber account, answer 3 questions to hit the paywall at `/feed`, and verify the paywall cards clearly state the payment methods and show proper icons.

### Implementation for User Story 2

- [ ] T005 [P] [US2] Update Monthly card in features/billing/paywall.tsx to show Credit Card is the only method
- [ ] T006 [P] [US2] Update Annual card in features/billing/paywall.tsx to highlight PIX and Card availability
- [ ] T007 [P] [US2] Add visual icon for PIX (e.g., QrCode) alongside CreditCard inside the checkout buttons in features/billing/paywall.tsx
- [ ] T008 [US2] Run subscription E2E tests in tests/e2e/subscription-unlock.spec.ts

**Checkpoint**: User Stories 1 and 2 are fully completed and tested.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Code cleanup, accessibility checks, and final test validation.

- [ ] T009 Run all unit and E2E tests to ensure no regressions in other files
- [ ] T010 Commit changes to the feature branch

---

## Dependencies & Execution Order

### Phase Dependencies

- **User Story 1 (Phase 3)**: No dependencies - can start immediately.
- **User Story 2 (Phase 4)**: Can proceed in parallel with or after User Story 1.
- **Polish (Phase 5)**: Depends on all user stories being complete.

### Parallel Opportunities

- T001 and T002 can be developed in parallel as they modify different parts of `pricing-section.tsx` (or can be done together).
- US1 (`pricing-section.tsx`) and US2 (`paywall.tsx`) modify completely different files, so they are fully parallelizable.
