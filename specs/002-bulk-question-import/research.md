# Research: Bulk Question Import

## Decision: Adapt `docs/bulk-question-import.md` instead of implementing it as-is

**Rationale**: The document captures useful CSV behavior: semicolon-separated
files, UTF-8, 5 MB limit, 500-row limit, header alias normalization, partial
success, and a modal that reports imported rows and row-level errors. However,
it describes an older architecture: `/admin/questions`, `ADMIN` and `MENTOR`
roles, CSV or JSON, Prisma, optional subject/content, and statuses
`PENDING/APPROVED/REJECTED`. The current app uses Supabase, author ownership,
and statuses `draft`, `published`, `unpublished`, and `archived`.

**Alternatives considered**:

- Implement the document exactly: rejected because it would bypass the requested
  author-specific flow and conflict with the current schema.
- Ignore the document: rejected because its parser constraints and UX decisions
  are directly useful.

## Decision: Import CSV rows as author-owned drafts

**Rationale**: The user asked for imported questions to go to the author's
editing/approval flow. The existing author flow already uses drafts and publish
validation, so imported content should enter that path rather than creating a new
review queue.

**Alternatives considered**:

- Create a new `pending_approval` status: rejected because it adds workflow
  states not present in the current model.
- Publish valid rows immediately: rejected because it skips author review.

## Decision: Support CSV only in this feature

**Rationale**: The user explicitly requested CSV ingestion. JSON support in the
existing document increases surface area without helping the requested admin
workflow.

**Alternatives considered**:

- CSV and JSON together: rejected for MVP scope control.
- Spreadsheet upload: rejected because CSV is enough and easier to validate.

## Decision: Require current-model classification fields

**Rationale**: Current `questions` rows require career, subject, difficulty,
author, and statement even for drafts. The older document's optional subject and
content behavior cannot be used without changing schema rules.

**Alternatives considered**:

- Insert unknown subject/career as null: rejected because the current database
  does not allow null for career or subject.
- Create missing subjects during import: rejected because subject management is
  an admin catalog concern and should remain explicit.

## Decision: Use PapaParse for CSV parsing

**Rationale**: The feature must handle quoted semicolon-separated fields,
headers, empty lines, and Portuguese text reliably. PapaParse is a proven CSV
parser and is already referenced by the existing bulk import document.

**Alternatives considered**:

- Hand-written CSV splitting: rejected because quoted delimiters and newlines
  inside fields are easy to mishandle.
- Server-side spreadsheet libraries: rejected because the input format is CSV,
  not XLSX.

## Decision: Use service-role persistence behind an admin-only route

**Rationale**: Current RLS allows authors to create their own questions, but an
admin importing for a different author needs server-side authority. The route
must first resolve and authorize the admin, then use the service-role client to
validate the author and persist rows.

**Alternatives considered**:

- Add an RLS policy that lets admins insert questions directly: rejected because
  the browser should not gain a broad insert path for author-owned content.
- Use the selected author's auth identity: rejected because the admin should not
  impersonate authors.

## Decision: Partial import with row-level failure reporting

**Rationale**: A bulk CSV often contains a small number of fixable row errors.
Saving valid rows and reporting invalid rows gives the admin a productive path
without editing the whole file before any progress.

**Alternatives considered**:

- All-or-nothing file import: rejected because one bad row would block hundreds
  of valid drafts.
- Silent skipping: rejected because admins need exact feedback to repair files.
