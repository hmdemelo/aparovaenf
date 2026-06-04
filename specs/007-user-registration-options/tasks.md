# Tasks: User Registration Options (Google OAuth & Magic Link)

**Input**: Design documents from `/specs/007-user-registration-options/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: E2E verification tests are included in the Polish phase to ensure robust operation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and base configuration updates

- [ ] T001 Configure Google client configuration settings in `lib/env/server.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core callback infrastructure required for both Google OAuth and Magic Link redirects

- [ ] T002 Implement unified Next.js App Router auth callback route in `app/api/auth/callback/route.ts`
- [ ] T003 [P] Add validation support for OAuth parameters in `lib/validation/schemas.ts`

**Checkpoint**: Foundation ready - OAuth callback routing is set up.

---

## Phase 3: User Story 1 - Authentication via Google Account (Priority: P1) 🎯 MVP

**Goal**: Enable fast, single-click sign-in and registration using a Google account.

**Independent Test**:
1. Go to the login page.
2. Click the Google Sign-in button.
3. Authenticate with Google.
4. Verify you are redirected to the feed and a student profile is provisioned in `user_profiles`.

### Implementation for User Story 1

- [ ] T004 [P] [US1] Create Google Sign-In Button component in `components/google-auth-button.tsx`
- [ ] T005 [US1] Integrate Google Sign-In Button into `LoginForm` in `features/auth/login-form.tsx`
- [ ] T006 [US1] Integrate Google Sign-In Button into `SignupForm` in `features/auth/signup-form.tsx`
- [ ] T007 [US1] Handle Google OAuth session exchanges and custom redirects in `/app/api/auth/callback/route.ts`

**Checkpoint**: Google OAuth is fully functional and testable independently.

---

## Phase 4: User Story 2 - Passwordless Registration & Login via Email Link (Priority: P1)

**Goal**: Enable users to sign up or sign in by requesting a secure login link sent to their email.

**Independent Test**:
1. Go to the login page.
2. Enter your email and click the send link button.
3. Locate the confirmation link in your inbox.
4. Click the link and verify you are logged in and redirected to the feed.

### Implementation for User Story 2

- [ ] T008 [US2] Implement Magic Link sending logic (`signInWithOtp`) in `features/auth/login-form.tsx`
- [ ] T009 [US2] Implement Magic Link sending logic (`signInWithOtp`) in `features/auth/signup-form.tsx`

**Checkpoint**: Magic Link passwordless authentication is fully functional.

---

## Phase 5: User Story 3 - Unified and Premium Authentication UI (Priority: P2)

**Goal**: Provide a polished, modern, and cohesive dual-mode login/signup experience.

**Independent Test**:
Open the login page and check that Google OAuth and Magic Link input sections are styled nicely and show clear error/loading feedback.

### Implementation for User Story 3

- [ ] T010 [P] [US3] Refactor and align form styles in `app/(public)/login/page.tsx` and `app/(public)/signup/page.tsx`
- [ ] T011 [US3] Implement dynamic loading state and success feedback elements in `features/auth/login-form.tsx` and `features/auth/signup-form.tsx`

**Checkpoint**: The new authentication UI is polished and responsive.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Test validation, cleanup, and documentation checks

- [ ] T012 [P] Implement automated E2E tests for callback exchange in `tests/e2e/auth-flow.spec.ts`
- [ ] T013 Run full lint, typecheck, and test suites to verify zero regressions

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion. Blocks user stories.
- **User Stories (Phase 3+)**: All depend on Foundational completion. US1 and US2 can run in parallel.
- **Polish (Final Phase)**: Runs after all user stories are implemented.

### Parallel Opportunities

- T003 can be implemented in parallel with T002.
- T004 can be created in parallel with T002 or T003.
- Once Phase 2 is complete, US1 (T004-T007) and US2 (T008-T009) can be developed independently.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational.
3. Complete Phase 3: User Story 1 (Google OAuth).
4. **STOP and VALIDATE**: Test Google OAuth login in development.

### Incremental Delivery

1. Deploy Google OAuth (US1) first.
2. Complete and deploy Magic Link registration (US2).
3. Polishing UI and adding E2E coverage.
