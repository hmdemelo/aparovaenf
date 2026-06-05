# Tasks: User Registration Options (Google OAuth, Magic Link & Registration Completion)

**Input**: Design documents from `/specs/007-user-registration-options/`
**Prerequisites**: `plan.md`, `spec.md`, `data-model.md`, `research.md`, `quickstart.md`

**Scope Mode**: This task list is intentionally status-aware. It records the feature work already present in the current worktree and structures the remaining implementation needed before final commit.

**Tests**: Required by the feature spec and constitution. Use Vitest for unit/integration coverage and Playwright for critical auth flows.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: User story label for story-specific tasks
- Every task includes exact file paths

---

## Phase 1: Completed Baseline (Do Not Re-implement)

**Purpose**: Preserve the already-implemented baseline so future work starts from the real current state.

- [X] T001 [P] Create database migration `supabase/migrations/008_add_registration_completed_column.sql` to add `registration_completed` to `user_profiles`
- [X] T002 [P] Update TypeScript database definitions in `lib/db/database.types.ts` to include `registration_completed`
- [X] T003 Update `getCurrentUser()` in `lib/auth/roles.ts` to fetch and return `registrationCompleted`
- [X] T004 [P] Add authentication redirect and e-mail validation helpers in `lib/validation/schemas.ts`
- [X] T005 [US1] Implement Google OAuth auto-completion in `app/api/auth/callback/route.ts`
- [X] T006 [US2] Remove signup password input and send Magic Link from `features/auth/signup-form.tsx`
- [X] T007 [P] [US2] Create password completion client component in `features/auth/complete-registration-form.tsx`
- [X] T008 [P] [US2] Create password completion page wrapper in `app/(public)/completar-cadastro/page.tsx`
- [X] T009 [US2] Redirect incomplete users from student routes in `app/(student)/feed/page.tsx`, `app/(student)/favorites/page.tsx`, `app/(student)/history/page.tsx`, `app/(student)/errors/page.tsx`, and `app/(student)/assinar/page.tsx`
- [X] T010 [US4] Include `registration_completed` in admin user queries in `features/admin/admin-service.ts`
- [X] T011 [US4] Display exact status badges in `app/(admin)/admin/users/page.tsx`
- [X] T012 [P] Add callback and registration-completion tests in `tests/integration/auth-callback.test.ts` and `tests/e2e/auth-flow.spec.ts`

**Checkpoint**: Existing implementation compiles and passes targeted auth tests.

---

## Phase 2: Foundational Remaining Fixes (Blocking)

**Purpose**: Close correctness/security gaps before final feature verification.

- [ ] T013 Add server-side session and completed-registration guards to `app/(public)/completar-cadastro/page.tsx`
- [ ] T014 Update password completion form error handling and remove debug logging in `features/auth/complete-registration-form.tsx`
- [ ] T015 Mark trusted admin-created authors as completed by setting `registration_completed: true` in `features/admin/admin-service.ts`
- [ ] T016 Align post-login destination documentation and tests for completed free students in `lib/auth/post-login.ts` and `tests/unit/post-login.test.ts`
- [ ] T017 Fix whitespace reported by `git diff --check` in `app/(student)/feed/page.tsx` and `tests/e2e/auth-flow.spec.ts`

**Checkpoint**: `git diff --check`, lint, typecheck, and unit tests should pass after Phase 2.

---

## Phase 3: User Story 2 Hardening - Password Completion Flow (Priority: P1)

**Goal**: Ensure `/completar-cadastro` cannot be used without a valid authenticated Magic Link session and behaves cleanly for completed users.

**Independent Test**:
1. Open `/completar-cadastro?next=/feed?career=enfermeiro-a` with no session.
2. Verify the user is redirected to `/login` with a safe `next`.
3. Open the same page as an incomplete authenticated user.
4. Set a password and verify `registration_completed` becomes `true`.
5. Open the same page as an already completed user and verify they are redirected away.

- [ ] T018 [P] [US2] Add unit/integration coverage for unauthenticated and already-completed `/completar-cadastro` access in `tests/integration/auth-callback.test.ts` or a new `tests/integration/complete-registration.test.ts`
- [ ] T019 [US2] Implement unauthenticated redirect and already-completed redirect in `app/(public)/completar-cadastro/page.tsx`
- [ ] T020 [US2] Verify Magic Link password completion remains covered in `tests/e2e/auth-flow.spec.ts`

**Checkpoint**: Password completion is independently testable and session-safe.

---

## Phase 4: User Story 4 Hardening - Status Identification (Priority: P2)

**Goal**: Make status labels accurate for normal students, incomplete Magic Link users, subscribers, admins, and authors.

**Independent Test**:
1. Query admin users with incomplete, free, active subscriber, admin, and author records.
2. Verify status labels are derived from `registration_completed` and active subscription.
3. Verify newly created authors do not show as `cadastro não concluído`.

- [ ] T021 [P] [US4] Add unit coverage for admin status mapping in `tests/unit/admin-users-status.test.ts`
- [ ] T022 [US4] Ensure `createAuthor()` persists `registration_completed: true` in `features/admin/admin-service.ts`
- [ ] T023 [US4] Verify admin UI status labels in `app/(admin)/admin/users/page.tsx`

**Checkpoint**: Admin status reporting matches FR-009 and FR-010.

---

## Phase 5: Spec/Data Alignment & Local Fixture Recovery

**Purpose**: Keep Spec Kit artifacts and local verification aligned with the actual implementation.

- [X] T024 [P] Update the user profile data model to include `registration_completed` in `specs/007-user-registration-options/data-model.md`
- [X] T025 [P] Update implementation strategy and remaining correction notes in `specs/007-user-registration-options/plan.md`
- [ ] T026 Repair or document local Supabase fixture state required by `npm run test:integration` in `supabase/seed.sql` and `tests/integration/helpers/local-env.ts`
- [ ] T027 Re-run `npm run test:integration` and record whether failures are fixed or explicitly environment-blocked in `specs/007-user-registration-options/tasks.md`

---

## Phase 6: Final Verification & Commit

**Purpose**: Produce the final confidence gate and a clean commit.

- [ ] T028 Run `git diff --check`
- [ ] T029 Run `npm run lint`
- [ ] T030 Run `npm run typecheck`
- [ ] T031 Run `npm test`
- [ ] T032 Run `npx vitest run tests/integration/auth-callback.test.ts`
- [ ] T033 Run `npm run test:e2e -- tests/e2e/auth-flow.spec.ts`
- [ ] T034 Run `npm run build`
- [ ] T035 Run `npm run test:integration` or document the exact fixture blocker if local Supabase remains out of sync
- [ ] T036 Review `git diff --stat` and commit the completed implementation

---

## Dependencies & Execution Order

1. **Phase 2** is blocking for all remaining user-story hardening.
2. **Phase 3** depends on T013 and T014.
3. **Phase 4** depends on T015.
4. **Phase 5** can run after Phase 2, except T027 depends on fixture repair.
5. **Phase 6** runs last.

## Parallel Opportunities

- T013 and T015 can be implemented in parallel because they touch different files.
- T018 and T021 can be written in parallel because they cover different behaviors.
- T024 and T025 are already complete and do not block code.
- T029, T030, T031, and T032 can be run in parallel after code changes settle.

## Implementation Strategy

### MVP Completion

1. Complete Phase 2.
2. Complete Phase 3.
3. Run T028-T034.

### Full Feature Completion

1. Complete MVP Completion.
2. Complete Phase 4.
3. Recover or document local integration fixture state in Phase 5.
4. Run all final verification tasks in Phase 6.
5. Commit with a conventional commit message.
