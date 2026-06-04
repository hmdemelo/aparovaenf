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

**Purpose**: Database and schema preparations

- [ ] T001 [P] Create database migration `supabase/migrations/008_add_registration_completed_column.sql` to add `registration_completed` to `user_profiles`
- [ ] T002 [P] Update TypeScript database definitions in `lib/db/database.types.ts` to include `registration_completed`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core model updates and auth helpers

- [ ] T003 Update `getCurrentUser()` in `lib/auth/roles.ts` to fetch and return `registrationCompleted`
- [ ] T004 Update schema validation in `lib/validation/schemas.ts` to handle registration status fields

**Checkpoint**: Foundation ready - DB schemas and auth helpers updated.

---

## Phase 3: User Story 1 & 2 - Passwordless Registration & Post-Callback Password Setup (Priority: P1) 🎯 MVP

**Goal**: Support email-only signup and force password creation upon email link validation.

**Independent Test**:
1. Go to `/signup`.
2. Verify there are no password input fields.
3. Sign up with a new email.
4. Click the confirmation link in the email.
5. Verify you are redirected to `/completar-cadastro` to set a password before you can view feed questions.

### Implementation for User Stories 1 & 2

- [ ] T005 Remove password inputs and submissions from `SignupForm` in `features/auth/signup-form.tsx`
- [ ] T006 Update auth callback route `app/api/auth/callback/route.ts` to redirect incomplete users to `/completar-cadastro` and auto-complete Google OAuth users
- [ ] T007 [P] Create password completion client component in `features/auth/complete-registration-form.tsx`
- [ ] T008 [P] Create `/completar-cadastro` page wrapper in `app/(public)/completar-cadastro/page.tsx`
- [ ] T009 Update student page routes (in `app/(student)/feed/page.tsx`, `/favorites/page.tsx`, `/history/page.tsx`, `/errors/page.tsx`, `/assinar/page.tsx`) to redirect incomplete users

**Checkpoint**: Password creation and redirection flow is fully functional.

---

## Phase 4: User Story 4 - User Status Identification (Priority: P2)

**Goal**: Trace and display the correct user registration and subscription status levels on the admin dashboard.

**Independent Test**:
1. Log in as an admin and open the user management tab.
2. Verify you see the exact status labels ("cadastro não concluído", "cadastro free", or "assinatura ativa") for each user.

### Implementation for User Story 4

- [ ] T010 Update user querying service `listUsers` in `features/admin/admin-service.ts` to include `registration_completed` and status resolution
- [ ] T011 Update the Admin Users view `app/(admin)/admin/users/page.tsx` to display the resolved status badges

**Checkpoint**: User status indicators are fully visible on the admin dashboard.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Test validation, cleanup, and documentation checks

- [ ] T012 [P] Update E2E tests in `tests/e2e/auth-flow.spec.ts` to verify the redirect flows and password completion screen
- [ ] T013 Run full lint, typecheck, and test suites to verify zero regressions
