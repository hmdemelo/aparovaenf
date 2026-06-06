# Tasks: Catálogos de Classificação para Autores

**Input**: Design documents from `/specs/008-author-classification-catalogs/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/api.md`, `quickstart.md`

**Scope Mode**: Status-aware. This task list records the implementation and verification already completed in the feature branch and keeps the staged remote rollout explicit.

**Tests**: Required by the feature spec and constitution. Unit tests use Vitest and Testing Library; integration tests use local Supabase; critical author flows use Playwright on desktop and mobile.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches independent files or behavior
- **[Story]**: User story label for story-specific tasks
- Every task includes an exact file path

---

## Phase 1: Setup and Database Foundation

**Purpose**: Establish the shared catalog schema, staged compatibility rollout and generated types.

- [X] T001 Create additive catalog migration in `supabase/migrations/010_author_classification_catalogs_additive.sql`
- [X] T002 Add scoped assunto uniqueness and legacy split migration in `supabase/migrations/011_author_topics_scoped_uniqueness.sql`
- [X] T003 [P] Add creator attribution and assunto hierarchy fields to `lib/db/database.types.ts`
- [X] T004 [P] Document catalog entities, RLS and staged rollout in `specs/008-author-classification-catalogs/data-model.md`
- [X] T005 Validate migrations `009`, `010` and `011` against local Supabase and fix deterministic UUID backfill in `supabase/migrations/010_author_classification_catalogs_additive.sql`

**Checkpoint**: Local Supabase applies all migrations and reports parity through migration `011`.

---

## Phase 2: Foundational API and Security

**Purpose**: Provide authenticated, validated and observable catalog operations used by every story.

- [X] T006 Add catalog query and create schemas with page limits and punctuation-only name rejection in `lib/validation/schemas.ts`
- [X] T007 Implement catalog authorization, creator labels, pagination, normalized search, duplicate recovery and operational events in `features/authors/classification-catalog-service.ts`
- [X] T008 [P] Implement authenticated discipline GET/POST handlers in `app/api/author/disciplines/route.ts`
- [X] T009 [P] Implement authenticated assunto GET/POST handlers in `app/api/author/topics/route.ts`
- [X] T010 [P] Implement authenticated banca GET/POST handlers in `app/api/author/boards/route.ts`
- [X] T011 Harden the legacy banca endpoint for creator attribution and safe errors in `app/api/boards/route.ts`
- [X] T012 Replace database error leakage with safe Portuguese responses in `app/api/author/disciplines/route.ts`, `app/api/author/topics/route.ts`, `app/api/author/boards/route.ts`, and `features/authors/classification-catalog-service.ts`
- [X] T013 Add route authorization, validation and safe-error integration coverage in `tests/integration/author-classification-catalogs.test.ts`

**Checkpoint**: Catalog endpoints validate all external input, enforce author/admin access and never expose database details.

---

## Phase 3: User Story 1 - Find and Select Existing Classifications (Priority: P1) MVP

**Goal**: Let an author search shared disciplines, assuntos and bancas and apply them to a question without losing unsaved content.

**Independent Test**: Open a new question, search and select a discipline, select one or more assuntos, select a banca and verify the editor displays every selection.

- [X] T014 [P] [US1] Add modal rendering, tab and selection unit coverage in `tests/unit/classification-catalog-dialog.test.tsx`
- [X] T015 [P] [US1] Add question topic validation and unclassified-draft regression coverage in `tests/unit/author-question-service.test.ts`
- [X] T016 [US1] Build the shared catalog modal and selection states in `features/authors/classification-catalog-dialog.tsx`
- [X] T017 [US1] Integrate discipline, assunto and banca selectors with stable test IDs in `features/authors/question-editor.tsx`
- [X] T018 [US1] Persist assunto identifiers and validate discipline compatibility before question mutation in `features/authors/author-question-service.ts`
- [X] T019 [US1] Load persisted assunto identifiers in `app/(author)/author/questions/[id]/edit/page.tsx`
- [X] T020 [US1] Keep empty `topic_ids` valid for incomplete drafts and deduplicate identifiers in `features/authors/author-question-service.ts`
- [X] T021 [US1] Preserve the dialog when a discipline change is cancelled and display newly created selections in `features/authors/classification-catalog-dialog.tsx` and `features/authors/question-editor.tsx`
- [X] T022 [US1] Verify existing selection and publication flows in `tests/e2e/author-publish.spec.ts`

**Checkpoint**: User Story 1 works independently for new and existing questions.

---

## Phase 4: User Story 2 - Create Missing Classifications (Priority: P1)

**Goal**: Let authors create disciplines, assuntos and bancas inside the editor and immediately reuse the created record.

**Independent Test**: Create one record of each catalog type, verify creator attribution and selection, then publish a question using the new records.

- [X] T023 [P] [US2] Add duplicate and creator mapping unit coverage in `tests/unit/classification-catalog-service.test.ts`
- [X] T024 [P] [US2] Add newly created discipline display coverage in `tests/unit/question-editor.test.ts`
- [X] T025 [US2] Implement discipline creation with required career selection in `features/authors/classification-catalog-dialog.tsx`
- [X] T026 [US2] Implement assunto creation with immediate access to the editor's current discipline in `features/authors/classification-catalog-dialog.tsx`
- [X] T027 [US2] Implement banca creation and immediate selection in `features/authors/classification-catalog-dialog.tsx`
- [X] T028 [US2] Scope duplicate assunto recovery by discipline in `features/authors/classification-catalog-service.ts`
- [X] T029 [US2] Verify discipline, assunto and banca creation through the complete editor flow in `tests/e2e/question-filtering.spec.ts`

**Checkpoint**: User Story 2 works without administrator intervention and handles equivalent existing records.

---

## Phase 5: User Story 3 - Navigate a Large Shared Catalog (Priority: P2)

**Goal**: Keep catalog navigation usable and deterministic as shared records grow.

**Independent Test**: Return more than 20 results, navigate with numbered controls, change the search and verify the page resets to one while totals remain correct.

- [X] T030 [P] [US3] Add numbered pagination and reopen-tab regression coverage in `tests/unit/classification-catalog-dialog.test.tsx`
- [X] T031 [US3] Implement maximum page size, deterministic ordering and totals in `features/authors/classification-catalog-service.ts`
- [X] T032 [US3] Implement compact numbered pagination with previous/next controls in `features/authors/classification-catalog-dialog.tsx`
- [X] T033 [US3] Reset pagination on search and tab changes and open directly on the requested tab in `features/authors/classification-catalog-dialog.tsx`
- [X] T034 [US3] Verify the catalog dialog on desktop and mobile in `tests/e2e/author-classification-catalogs.spec.ts`

**Checkpoint**: User Story 3 supports catalog growth without horizontal overflow or ambiguous navigation.

---

## Phase 6: Compatibility and Regression Coverage

**Purpose**: Align legacy question/feed behavior with scoped assunto uniqueness.

- [X] T035 Update legacy feed integration fixtures for discipline-scoped assuntos in `tests/integration/student-feed.test.ts`
- [X] T036 Update former inline banca/tag E2E flows to use catalog APIs in `tests/e2e/question-filtering.spec.ts`
- [X] T037 Update former native discipline selection E2E flows in `tests/e2e/author-publish.spec.ts`
- [X] T038 Keep legacy banca writes compatible with catalog RLS in `features/authors/author-question-service.ts` and `app/api/boards/route.ts`

---

## Phase 7: Final Verification and Rollout

**Purpose**: Prove behavior locally, audit the change and deliver it through the staged remote migration sequence.

- [X] T039 Run `git diff --check`
- [X] T040 Run `npm run typecheck`
- [X] T041 Run `npm run lint`
- [X] T042 Run `npm test`
- [X] T043 Run `npm run test:integration` against local Supabase
- [X] T044 Run targeted catalog, publication and assunto Playwright flows on Chromium and Mobile Chrome
- [X] T045 Run `npm run build`
- [X] T046 Review authentication, authorization, RLS, input validation, secret exposure and user-facing errors in catalog API and migration files
- [X] T047 Apply additive migration `010_author_classification_catalogs_additive.sql` to the linked remote Supabase project
- [ ] T048 Deploy the ID-based catalog application before changing remote assunto uniqueness
- [ ] T049 Apply scoped uniqueness migration `011_author_topics_scoped_uniqueness.sql` after T048
- [ ] T050 Confirm local/remote migration parity with `npx supabase migration list`
- [X] T051 Commit the completed implementation and verification with a conventional commit

---

## Dependencies and Execution Order

1. Phase 1 blocks all API and editor work.
2. Phase 2 blocks every user story.
3. User Stories 1 and 2 are both P1; US2 reuses the modal and service foundation from US1.
4. User Story 3 depends on the shared list APIs but can otherwise be developed independently.
5. Compatibility work follows ID-based editor persistence.
6. T047 is additive and may run before deployment.
7. T049 MUST run only after T048 because migration `011` removes the global `tags.slug` conflict target used by the legacy application.
8. T050 and T051 run after the rollout and final diff review.

## Parallel Opportunities

- T008, T009 and T010 can run in parallel.
- T014 and T015 can run in parallel.
- T023 and T024 can run in parallel.
- T030 can run while T031 is implemented.
- T039 through T046 can run in parallel once code changes settle, except build and browser tests may compete for local resources.

## Implementation Strategy

### MVP

1. Complete Phases 1 and 2.
2. Complete User Story 1.
3. Verify existing selections and draft persistence independently.

### Incremental Delivery

1. Add User Story 2 for inline creation.
2. Add User Story 3 for shared-catalog scale.
3. Complete compatibility coverage.
4. Apply remote migrations in the strict T047 -> T048 -> T049 order.

## Verification Result

- `git diff --check`: passed
- `npm run typecheck`: passed
- `npm run lint`: passed
- `npm test`: passed, 25 files / 133 tests
- `npm run test:integration`: passed, 12 files / 50 tests against local Supabase
- Targeted Playwright: passed, 6 tests across Chromium and Mobile Chrome
- `npm run build`: passed
- Local migrations: parity through `011`
- Remote migrations: additive migration `010` applied; `011` intentionally waits for the compatible application deployment
- Dependency audit: intentionally excluded from this completion request
