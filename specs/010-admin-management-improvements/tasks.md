# Tasks: Admin Management Improvements

**Input**: Design documents from `/specs/010-admin-management-improvements/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

---

## Phase 1: Foundational (Database & RLS)

**Purpose**: Database migrations and security policies setup

- [x] **T001**: Create and apply database migration `supabase/migrations/012_admin_management_improvements.sql` adding `force_password_change` column and updating admin update/delete RLS policies.
- [x] **T002**: Update local types `lib/db/database.types.ts` to include the new column `force_password_change`.

---

## Phase 2: User Story 1 - Force User Password Change (Priority: P1) 🎯 MVP

**Goal**: Allow admins to set user passwords and force a change on next login.

**Independent Test**: Reset a user's password in the admin panel, login as that user, and verify redirection to `/force-password` to complete the password update before accessing other pages.

### Implementation
- [x] **T003**: Create server action or API route to handle password reset by administrators utilizing the Supabase Auth Admin API (SERVICE_ROLE).
- [x] **T004**: Add "Alterar Senha" button and modal dialog to `/app/(admin)/admin/users/page.tsx` invoking the password reset action.
- [x] **T005**: Implement a middleware/guard function checking if `user_profiles.force_password_change` is active.
- [x] **T006**: Integrate the password guard in route layouts (`app/(student)/layout.tsx`, `app/(author)/author/layout.tsx`, `app/(admin)/admin/layout.tsx`) to redirect to `/force-password` when `true`.
- [x] **T007**: Create `/app/(public)/force-password/page.tsx` presenting the mandatory password change form.
- [x] **T008**: Implement password submission logic calling `supabase.auth.updateUser` on the server and setting `force_password_change = false` through a protected service-role update.

---

## Phase 3: User Story 2 - Catalog Management (Edit/Delete) (Priority: P1) 🎯 MVP

**Goal**: Expose edit and delete classification catalog items to admins safely.

**Independent Test**: Edit and delete subjects/tags/boards in the admin interface; verify database errors when deleting items in use.

### Implementation
- [x] **T009**: Update `features/authors/classification-catalog-service.ts` to include edit and delete functions for all managed classifications.
- [x] **T010**: Implement reference verification logic for deletions (checking questions/tags using the item) to block deletion if in use.
- [x] **T011**: Create administrative page interface or extend `/app/(admin)/admin/subjects/page.tsx` to display edit and delete buttons for disciplines (`subjects`), subjects (`tags`), and boards (`boards`) with confirmation modal dialogs.
- [x] **T012**: Hook the buttons to edit/delete APIs and display informative success or reference-error messages in Portuguese.

---

## Phase 4: User Story 3 - Sort Questions in Moderation Table (Priority: P2)

**Goal**: Implement sorting on column header clicks in the moderation table.

**Independent Test**: Navigate to `/admin/questions` and toggle column sorting by clicking header labels.

### Implementation
- [x] **T013**: Keep the server query ordered by newest first and expose interactive sorting for the currently loaded moderation page.
- [x] **T014**: Update the moderation table headers to toggle ascending and descending sorting in component state.

---

## Phase 5: User Story 4 - Limit Question Moderation List to 30 Items (Priority: P2)

**Goal**: Otimize load time by limiting default moderation results to 30 items.

**Independent Test**: View the moderation panel and verify it loads the most recent 30 questions.

### Implementation
- [x] **T015**: Modify `listAllQuestions` query in `features/admin/admin-service.ts` to apply `LIMIT 30` (or dynamic pagination limit) and `created_at DESC` by default.

---

## Phase 6: User Story 5 - Explicit Filter Submission in Question Moderation (Priority: P2)

**Goal**: Trigger query searches only when clicking "Buscar".

**Independent Test**: Modify filter values and verify table updates only after clicking "Buscar".

### Implementation
- [x] **T016**: Refactor filters on `/app/(admin)/admin/questions/page.tsx` to keep inputs in local React state instead of executing query refetches on change.
- [x] **T017**: Render a "Buscar" button that triggers list reload with all updated filter parameters.

---

## Phase 7: Polish & Verification

- [x] **T018**: Run all unit and integration tests (`npm run test`, `npm run test:integration`).
- [ ] **T019**: Run Playwright end-to-end test suite (`npm run test:e2e`).
- [x] **T020**: Run Next.js production build (`npm run build`) to verify compilation and static checks.

> T019 remains pending because the local Supabase instance is unavailable. The
> E2E global setup mutates seeded records and must not run against the linked
> remote project.
