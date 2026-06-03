# Tasks: Bulk Question Import

**Input**: Design documents from `/specs/002-bulk-question-import/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, quickstart.md  
**Tests**: Required by ECC/TDD for parser, service, route, UI, and critical admin/author flows.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the CSV parsing dependency and template fixture surface.

- [x] T001 Add `papaparse` and its TypeScript types to `package.json` and `package-lock.json`
- [x] T002 Create CSV template fixture in `docs/template-importacao-questoes.csv`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Parser, validation, and service building blocks required before UI and route work.

- [x] T003 [P] Write parser unit tests for header aliases, row limits, required fields, and answer-key validation in `tests/unit/bulk-question-import-parser.test.ts`
- [x] T004 Implement CSV parser and row normalization in `features/admin/bulk-question-import-parser.ts`
- [x] T005 [P] Write import service unit tests for draft payload creation, author validation, partial success, and audit summary in `tests/unit/bulk-question-import-service.test.ts`
- [x] T006 Implement author-scoped import service in `features/admin/bulk-question-import-service.ts`
- [x] T007 Add bulk import request/result types and shared validation helpers in `lib/validation/schemas.ts`

**Checkpoint**: Parser and service can be tested without the admin UI.

---

## Phase 3: User Story 1 - Admin imports CSV for an author (Priority: P1)

**Goal**: Admin uploads a CSV from a specific author row and gets a result summary.

**Independent Test**: Admin route creates draft questions for one author from valid CSV rows and reports invalid rows.

### Tests

- [x] T008 [P] [US1] Write integration tests for `POST /api/admin/authors/[id]/questions/bulk-import` in `tests/integration/admin-bulk-question-import.test.ts`
- [x] T009 [P] [US1] Write component test for opening import modal from author row in `tests/unit/admin-authors-manager.test.ts`
- [x] T010 [P] [US1] Write component test for file selection, submit disabled state, and result summary in `tests/unit/bulk-question-import-dialog.test.ts`

### Implementation

- [x] T011 [US1] Implement admin bulk import route in `app/api/admin/authors/[id]/questions/bulk-import/route.ts`
- [x] T012 [US1] Build import modal component in `features/admin/bulk-question-import-dialog.tsx`
- [x] T013 [US1] Add `Importar` button beside `Editar` in `features/admin/admin-authors-manager.tsx`
- [x] T014 [US1] Refresh `/admin/authors` data after successful import in `features/admin/admin-authors-manager.tsx`
- [x] T015 [US1] Record server-side import result context in `features/admin/bulk-question-import-service.ts`

**Checkpoint**: Admin can import CSV rows for one author and see import results.

---

## Phase 4: User Story 2 - Author reviews imported drafts (Priority: P1)

**Goal**: Imported questions appear in the existing author draft/edit/publish flow.

**Independent Test**: The selected author sees imported drafts and cannot publish incomplete drafts.

### Tests

- [x] T016 [P] [US2] Write integration test that imported drafts appear in `listAuthorQuestions` in `tests/integration/author-bulk-imported-drafts.test.ts`
- [x] T017 [P] [US2] Extend author publishing integration test for incomplete imported drafts in `tests/integration/author-questions.test.ts`

### Implementation

- [x] T018 [US2] Ensure imported questions use status `draft` and selected `author_id` in `features/admin/bulk-question-import-service.ts`
- [x] T019 [US2] Ensure imported alternatives preserve A-E order and correct flag in `features/admin/bulk-question-import-service.ts`
- [x] T020 [US2] Verify author list and editor require no separate approval UI in `features/authors/author-question-service.ts`

**Checkpoint**: Imported content stays in author review until existing publish validation passes.

---

## Phase 5: User Story 3 - Admin uses a compatible CSV template (Priority: P2)

**Goal**: Admin can access a current template and understand row-level errors.

**Independent Test**: Downloaded template headers match parser expectations and modal displays Portuguese row errors.

### Tests

- [x] T021 [P] [US3] Write route test for template download in `tests/integration/admin-bulk-template.test.ts`
- [x] T022 [P] [US3] Write parser compatibility test for aliases from `docs/bulk-question-import.md` in `tests/unit/bulk-question-import-parser.test.ts`
- [x] T023 [P] [US3] Extend modal component test for displaying up to 50 row errors in `tests/unit/bulk-question-import-dialog.test.ts`

### Implementation

- [x] T024 [US3] Implement template download route in `app/api/admin/questions/bulk-template/route.ts`
- [x] T025 [US3] Add template link and constraints copy to `features/admin/bulk-question-import-dialog.tsx`
- [x] T026 [US3] Update `docs/bulk-question-import.md` to describe the current author-scoped draft import model

**Checkpoint**: Admin has a template and actionable errors.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: End-to-end verification, security review, and quality gates.

- [x] T027 [P] Write Playwright E2E smoke for admin bulk import in `tests/e2e/admin-bulk-question-import.spec.ts`
- [x] T028 Review authorization, file-size validation, and service-role usage in `app/api/admin/authors/[id]/questions/bulk-import/route.ts`
- [x] T029 Verify import audit event/log coverage in `features/admin/bulk-question-import-service.ts`
- [x] T030 Run `npm run typecheck`
- [x] T031 Run `npm run lint`
- [x] T032 Run `npm run test`
- [x] T033 Run `npm run test:integration`
- [x] T034 Run `npm run test:e2e`
- [x] T035 Run `npm run build`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup; blocks route and UI work.
- **User Story 1 (Phase 3)**: Depends on Foundational.
- **User Story 2 (Phase 4)**: Depends on User Story 1 persistence.
- **User Story 3 (Phase 5)**: Depends on parser behavior from Foundational and can run after US1 starts.
- **Polish (Phase 6)**: Depends on selected stories being implemented.

### User Story Dependencies

- **US1**: MVP slice. Delivers admin upload and draft creation.
- **US2**: Depends on US1-created drafts but uses existing author flow.
- **US3**: Enhances usability with template and clearer compatibility docs.

### Parallel Opportunities

- T003, T005, and T007 can be split after T001.
- T008, T009, and T010 can be written in parallel after Foundational types are clear.
- T016 and T017 can run in parallel after US1 service behavior exists.
- T021, T022, and T023 can run in parallel.

---

## Implementation Strategy

### MVP First

1. Complete Setup and Foundational phases.
2. Complete US1.
3. Validate one admin can import mixed-validity CSV rows for one author.
4. Confirm imported questions are drafts and not visible in the feed.

### Incremental Delivery

1. US1: admin import modal and route.
2. US2: author review verification and publish guard coverage.
3. US3: template download, compatibility docs, and polished error display.

### Notes

- Tests must be written before implementation for each task group.
- Do not add JSON import in this feature.
- Do not add duplicate detection in this feature.
- Do not create a new approval status or queue.
