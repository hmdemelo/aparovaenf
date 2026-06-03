# Implementation Plan: Question Filtering and Tagging

**Branch**: `003-question-filtering-tags` | **Date**: 2026-06-03 | **Spec**: [spec.md](file:///Users/hugo/projetos/aprovaenf/specs/003-question-filtering-tags/spec.md)
**Input**: Feature specification from `/specs/003-question-filtering-tags/spec.md`

## Summary
Introduce dynamic tagging (sub-subjects) for questions managed by authors, inline creation of exam boards (bancas) via a "+" button next to the search field, and multi-criteria filters (banca, assunto, tags) in the student feed to customize study lists.

---

## Technical Context

**Language/Version**: TypeScript, Node 20+, React 19, Next.js 16  
**Primary Dependencies**: lucide-react, @supabase/ssr, @supabase/supabase-js  
**Storage**: Supabase PostgreSQL  
**Testing**: Vitest (unit/integration), Playwright (E2E)  
**Target Platform**: Web (Responsive: mobile-first)  
**Project Type**: Next.js full-stack web application  

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

1. **Mobile-First Learning Loop**: The filter UI in the student feed must be responsive, easily accessible on mobile viewports, and not disrupt the one-question-at-a-time flow.
2. **Secure Data Boundaries**:
   - `tags` and `question_tags` tables must have RLS enabled.
   - Anyone can read tags (public).
   - Only authenticated users with role `author` (or `admin`) can insert new tags and link tags to questions.
   - Board creation must be validated server-side to check authentication.
3. **Test-First Delivery**: Add unit/integration tests for tag creation, question-tag linkage, and feed filtering, plus E2E coverage for the inline board creation and tag selection.

---

## Proposed Changes

### 1. Database Layer (Supabase Migrations)

#### [NEW] [006_tags_and_inline_boards.sql](file:///Users/hugo/projetos/aprovaenf/supabase/migrations/006_tags_and_inline_boards.sql)
Create a new migration script to:
- Create `tags` table:
  ```sql
  create table tags (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    slug text not null unique,
    created_at timestamptz not null default now()
  );
  ```
- Create `question_tags` join table:
  ```sql
  create table question_tags (
    question_id uuid not null references questions (id) on delete cascade,
    tag_id uuid not null references tags (id) on delete cascade,
    primary key (question_id, tag_id)
  );
  ```
- Enable Row Level Security (RLS) on both tables:
  ```sql
  alter table tags enable row level security;
  alter table question_tags enable row level security;
  ```
- Define RLS policies:
  - `tags`: SELECT is public. INSERT is allowed for authenticated users with role `author` or `admin`.
  - `question_tags`: SELECT is public. INSERT/DELETE is allowed for authenticated users who own the corresponding question.
- Update `boards` table RLS policies:
  - Allow INSERT for authenticated authors (currently it may be admin-only, let's verify or add insert policy for role `author` or authenticated users).

---

### 2. Services & Types Layer (Regenerate types + CRUD update)

#### [MODIFY] [database.types.ts](file:///Users/hugo/projetos/aprovaenf/lib/db/database.types.ts)
Regenerate database types using:
```bash
npx supabase gen types typescript --local > lib/db/database.types.ts
```

#### [MODIFY] [author-question-service.ts](file:///Users/hugo/projetos/aprovaenf/features/authors/author-question-service.ts)
- Extend `QuestionDraftInput` to accept an array of tag names: `tags?: string[]`.
- In `createDraftQuestion` and `updateQuestion`, after inserting/updating the question:
  - Upsert the tags dynamically: clean and slugify tag names, select existing tags to get IDs, insert missing tags, and retrieve their IDs.
  - Delete old links in `question_tags` for the question.
  - Insert new links in `question_tags`.
- In `getAuthorQuestion`, load the tags associated with the question.
- Add a new service function `createBoardInline(db, name: string)`:
  - Slugify name.
  - Insert new board.
  - Return the created board object.

---

### 3. Frontend & UI Components (Author Panel)

#### [MODIFY] [question-editor.tsx](file:///Users/hugo/projetos/aprovaenf/features/authors/question-editor.tsx)
- Add a **Tag Input** field:
  - Fetch existing tags catalog for auto-completion.
  - Allow typing and creating new tags inline.
- Refactor the **Board Select** field:
  - Turn the native select into a searchable select (combobox).
  - If search query has no results, display a "+" button next to the input.
  - Clicking "+" calls the API/action to create the board inline, updates the options list, and selects the new board.

---

### 4. Student Feed Filtering

#### [MODIFY] [student-feed/feed-service.ts] (or matching feed service file)
- Update the feed query function to accept `subject_id`, `board_id`, and `tag_ids`.
- Join `question_tags` if `tag_ids` are specified to filter the random questions.

---

## Verification Plan

### Automated Tests
- Integration tests in `tests/integration/author-question-service.test.ts` to assert that:
  - Tags are created and linked correctly on save.
  - Board is created inline and linked successfully.
- E2E tests in `tests/e2e` for:
  - Inline board creation with search and "+" button.
  - Filtering feed by subjects, boards, and tags.

### Manual Verification
- Start dev server, log in as author, create a question, add new tags, search/create a new board.
- Open student feed, apply filters, and confirm that only matching questions are shown.
