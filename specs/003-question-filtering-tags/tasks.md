# Tasks: Question Filtering and Tagging

This document lists the actionable implementation tasks for the **Question Filtering and Tagging** feature.

---

## Phase 1: Setup

- [ ] T001 Create database migration for tags and dynamic boards in `supabase/migrations/006_tags_and_inline_boards.sql`
- [ ] T002 Execute database migrations locally using `npx supabase db push`
- [ ] T003 Regenerate Supabase TypeScript types using `npx supabase gen types typescript --local > lib/db/database.types.ts`

---

## Phase 2: Foundational

- [ ] T004 Implement helper to clean and slugify tag names in `lib/security/slug.ts` or similar utility
- [ ] T005 [P] Update database schema types/interfaces in `lib/db/database.types.ts` to reflect `tags` and `question_tags`
- [ ] T006 [P] Add unit tests for tag slugification utility

---

## Phase 3: User Story 1 - Dynamic Question Tagging [US1]

- [ ] T007 [US1] Add integration tests in `tests/integration/author-questions.test.ts` to verify tag creation and question linkage
- [ ] T008 [US1] Update `QuestionDraftInput` to support tags array in `features/authors/author-question-service.ts`
- [ ] T009 [US1] Implement tag saving logic (upsert tags and update join table) inside `createDraftQuestion` and `updateQuestion` in `features/authors/author-question-service.ts`
- [ ] T010 [US1] Update `getAuthorQuestion` to retrieve and return question tags in `features/authors/author-question-service.ts`
- [ ] T011 [US1] Implement server action or API route to fetch autocomplete tag suggestions in `app/api/tags/route.ts` or as a server action
- [ ] T012 [US1] Integrate a multi-select Tag Input component in `features/authors/question-editor.tsx`

---

## Phase 4: User Story 2 - Inline Board Registration [US2]

- [ ] T013 [US2] Add integration tests in `tests/integration/author-questions.test.ts` to verify inline board creation and auto-selection
- [ ] T014 [US2] Implement `createBoardInline` service function in `features/authors/author-question-service.ts`
- [ ] T015 [US2] Create a server action or API endpoint to allow authors to insert new boards inline in `app/api/boards/route.ts`
- [ ] T016 [US2] Refactor the Board dropdown in `features/authors/question-editor.tsx` into a searchable input
- [ ] T017 [US2] Implement the "+" button to register a new board dynamically when search has no results in `features/authors/question-editor.tsx`

---

## Phase 5: User Story 3 - Student Feed Filtering [US3]

- [ ] T018 [US3] Add integration tests in `tests/integration/student-feed.test.ts` to verify feed results filter correctly by Subject, Board, and Tags
- [ ] T019 [US3] Update feed retrieval query in `features/student-feed/feed-service.ts` (or equivalent feed service file) to filter by optional subject, board, and tag ids
- [ ] T020 [US3] Update the feed UI to display collapsible filter dropdowns for Subject, Board, and Tags
- [ ] T021 [US3] Connect filter changes in the UI to trigger query parameters and fetch updated questions

---

## Phase 6: Polish

- [ ] T022 Implement Playwright E2E test in `tests/e2e/question-filtering.spec.ts` covering tag creation, inline board creation, and filtering
- [ ] T023 Run verification gates `npm run build`, `npm run typecheck`, `npm run lint`, and `npm run test`
