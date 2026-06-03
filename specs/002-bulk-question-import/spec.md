# Feature Specification: Bulk Question Import

**Feature Branch**: `002-bulk-question-import`  
**Created**: 2026-06-03  
**Status**: Draft  
**Input**: User description: "Feature de importacao em massa de questoes via CSV para admin na sessao de autores, com botao ao lado de editar autor, modal de upload, e questoes importadas indo para edicao/aprovacao do autor. Avaliar `docs/bulk-question-import.md`."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin imports CSV for an author (Priority: P1)

As an admin, I want to open a bulk import action from a specific author row and
upload a CSV so that many question drafts are assigned to that author at once.

**Why this priority**: The requested value is operational speed for seeding
author-owned content without bypassing the existing author review flow.

**Independent Test**: An authenticated admin opens `/admin/authors`, clicks
`Importar` beside an author, uploads a CSV with valid and invalid rows, and sees
a result summary. Valid rows are created as drafts for that author; invalid rows
are reported without blocking valid rows.

**Acceptance Scenarios**:

1. **Given** an admin is viewing authors, **When** they click `Importar` beside
   one author, **Then** a modal opens with that author's name, CSV constraints,
   and a file selector.
2. **Given** the admin selects a valid CSV, **When** they confirm the import,
   **Then** the system creates draft questions owned by the selected author and
   shows imported and failed counts.
3. **Given** the CSV has mixed valid and invalid rows, **When** import finishes,
   **Then** valid rows are saved and invalid rows are shown with line-level
   messages.
4. **Given** a non-admin attempts the import, **When** the upload request is
   submitted, **Then** the system rejects the action without creating questions.

---

### User Story 2 - Author reviews imported drafts (Priority: P1)

As an author, I want imported questions to appear in my existing editing flow so
that I can adjust, complete, and publish them only after review.

**Why this priority**: Imported content must not reach students until the owning
author reviews it under the same publishing rules as manually created content.

**Independent Test**: After an admin imports valid CSV rows for an author, that
author logs in, opens their question list, sees the imported draft questions,
edits one draft, and can publish only after existing publication requirements
are satisfied.

**Acceptance Scenarios**:

1. **Given** questions were imported for an author, **When** that author opens
   their question list, **Then** the imported questions appear as drafts.
2. **Given** an imported draft lacks a general comment or correct answer,
   **When** the author attempts to publish it, **Then** publication is blocked by
   the existing validation flow.
3. **Given** an author edits an imported draft, **When** they save changes,
   **Then** ownership remains assigned to that author.

---

### User Story 3 - Admin uses a compatible CSV template (Priority: P2)

As an admin, I want a clear import template and understandable errors so that I
can prepare CSV files without guessing the required columns.

**Why this priority**: A template reduces failed imports and makes the feature
usable by non-technical operators after the first implementation slice.

**Independent Test**: An admin downloads or copies the template, fills two
questions, uploads the file, and receives either successful draft creation or
line-specific validation feedback in Portuguese.

**Acceptance Scenarios**:

1. **Given** the import modal is open, **When** the admin requests the template,
   **Then** the system provides a CSV template matching the current question
   model.
2. **Given** a CSV uses aliases from the existing bulk import document where
   compatible, **When** the admin uploads it, **Then** the parser accepts those
   aliases for statement, alternatives, answer key, subject, source, year, and
   commentary.
3. **Given** a CSV omits fields required by the current question model, **When**
   validation runs, **Then** the admin receives clear row-level errors.

### Edge Cases

- The selected author no longer exists when the admin submits the modal.
- The file is not CSV, is empty, exceeds 5 MB, or has more than 500 data rows.
- CSV headers contain accents, spaces, periods, hyphens, or different casing.
- Required current-model fields are missing: statement, career, subject, or
  difficulty.
- Career, subject, difficulty, or board names do not match existing records.
- A row has fewer than two alternatives or more than five alternatives.
- A row marks a correct answer whose alternative text is blank or absent.
- A row provides invalid year values or unsupported source type values.
- The same CSV is uploaded twice.
- A server error occurs after some rows have been created.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The authors admin page MUST show an `Importar` action beside each
  author's edit action.
- **FR-002**: The import action MUST open a modal scoped to the selected author.
- **FR-003**: The system MUST allow only authenticated admins to import questions
  for an author.
- **FR-004**: The modal MUST accept CSV files encoded as UTF-8 and reject other
  file types.
- **FR-005**: The system MUST reject files larger than 5 MB before importing any
  rows.
- **FR-006**: The system MUST reject CSV files with more than 500 data rows
  before importing any rows.
- **FR-007**: The CSV parser MUST normalize compatible headers from
  `docs/bulk-question-import.md`, including statement/enunciado, alternatives
  A-E, correct answer/gabarito, subject/disciplina, source/origem, year/ano, and
  commentary/comentario.
- **FR-008**: The current import template MUST require fields needed by the
  existing question model: career, subject, difficulty, statement, and at least
  two alternatives.
- **FR-009**: The system MUST validate each data row independently and report
  the row number and error message for invalid rows.
- **FR-010**: Valid rows MUST create draft questions assigned to the selected
  author.
- **FR-011**: Importing MUST NOT publish questions or make them eligible for the
  student feed.
- **FR-012**: Imported drafts MUST appear in the owning author's existing
  question editing list.
- **FR-013**: Existing publication validation MUST remain required before an
  imported question can be published.
- **FR-014**: Partial success MUST be supported: valid rows are imported while
  invalid rows are reported.
- **FR-015**: If every row is invalid, the system MUST create no questions and
  show a failed import summary.
- **FR-016**: The result summary MUST include imported count, failed count, and
  row-level errors.
- **FR-017**: The system MUST preserve alternative order A-E and any
  alternative-level comments supplied by supported columns.
- **FR-018**: The system MUST record enough operational context to audit an
  import: admin identity, author identity, total rows, imported rows, failed
  rows, and timestamp.
- **FR-019**: Uploading the same CSV twice MAY create duplicate draft questions;
  automatic duplicate detection is out of scope for this feature.
- **FR-020**: The existing `docs/bulk-question-import.md` MUST NOT be treated as
  directly implementable without adaptation to the current author-owned draft
  model.

### Key Entities *(include if feature involves data)*

- **BulkImportSession**: One admin-triggered upload attempt for one author,
  including file metadata, row counts, result summary, and audit context.
- **ParsedQuestionRow**: One normalized CSV row before persistence, including
  classification, statement, alternatives, source metadata, comments, and
  validation errors.
- **QuestionDraft**: A question created from a valid CSV row with status `draft`
  and ownership assigned to the selected author.
- **AlternativeDraft**: Ordered alternative text and optional comment attached to
  an imported question draft.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An admin can import a 100-row valid CSV for one author and receive
  a result summary in under 30 seconds in the local development environment.
- **SC-002**: At least 95% of row validation failures identify the exact CSV line
  and a Portuguese message that tells the admin what to fix.
- **SC-003**: Zero imported questions are published automatically during import.
- **SC-004**: An author can find imported drafts in their question list without
  using a new navigation area.
- **SC-005**: The template generated for this feature can be uploaded unchanged,
  except for filling real values, and pass structural validation.

## Assumptions

- "Edicao/aprovacao do autor" means the existing author draft/edit/publish flow,
  not a new separate approval queue.
- CSV is the only input format for this feature. JSON support from the existing
  bulk document is out of scope.
- The import uses the current database model, where career, subject, difficulty,
  author, and statement are required for a draft question.
- Existing author ownership and publish validation remain the source of truth.
- The 5 MB and 500-row limits from `docs/bulk-question-import.md` are reasonable
  defaults for the MVP.
