# Implementation Plan: Bulk Question Import

**Branch**: `002-bulk-question-import` | **Date**: 2026-06-03 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/002-bulk-question-import/spec.md`

## Summary

Add an admin-only, author-scoped CSV import flow from `/admin/authors`. Each
author row gets an `Importar` action next to `Editar`; the action opens a modal
that accepts a CSV, validates rows, and creates draft questions assigned to that
author. Imported questions stay out of the student feed until the author reviews
and publishes them through the existing author flow.

The existing `docs/bulk-question-import.md` is a partial reference. Its CSV
limits, alias normalization, partial-success behavior, and modal result UX are
useful. Its global route, JSON support, Prisma model, `PENDING/APPROVED/REJECTED`
status flow, optional subject/content behavior, and `ADMIN`/`MENTOR` role model
do not match the current application and must be adapted.

## Technical Context

**Language/Version**: TypeScript on current LTS Node runtime  
**Primary Dependencies**: Next.js App Router, React, Tailwind CSS, lucide-react,
Supabase JS client, Zod, Vitest, Playwright, PapaParse for CSV parsing  
**Storage**: Supabase Postgres with existing `questions`, `alternatives`,
`author_profiles`, `careers`, `subjects`, and `boards` tables  
**Testing**: Vitest for parser/service/component tests, integration tests for
admin route behavior, Playwright for the admin upload smoke  
**Target Platform**: Vercel web deployment and modern mobile/desktop browsers  
**Project Type**: Full-stack web application  
**Performance Goals**: Import 100 valid rows in under 30 seconds locally; reject
files over 5 MB or 500 data rows before persistence  
**Constraints**: CSV only for this feature; no automatic duplicate detection; no
new global approval queue; no published questions created by import  
**Scale/Scope**: Admin operational tool for early content seeding, up to 500
questions per upload

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Mobile-first learning value: PASS. The feature improves student content supply
  but keeps student-facing feed rules unchanged.
- Secure data boundaries: PASS. Admin authorization is enforced server-side, and
  import persistence happens only after validating the selected author.
- Test-first delivery: PASS. Tasks require parser, service, route, component,
  integration, and E2E coverage before implementation slices.
- Simple modular architecture: PASS. The feature stays inside the existing
  Next.js monolith and reuses current admin and author domains.
- Observable operations: PASS. Import result summaries include enough context for
  audit logs and operational debugging.

## Project Structure

### Documentation (this feature)

```text
specs/002-bulk-question-import/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── api.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
app/
├── (admin)/
│   └── admin/authors/page.tsx
└── api/
    └── admin/
        ├── authors/[id]/questions/bulk-import/route.ts
        └── questions/bulk-template/route.ts

features/
├── admin/
│   ├── admin-authors-manager.tsx
│   ├── bulk-question-import-dialog.tsx
│   ├── bulk-question-import-parser.ts
│   └── bulk-question-import-service.ts
└── authors/
    └── author-question-service.ts

lib/
├── api/
├── db/
└── validation/

tests/
├── e2e/
├── integration/
└── unit/
```

**Structure Decision**: Keep UI and admin import orchestration in
`features/admin`, because the entry point and authorization are admin-owned.
Imported questions still use the existing author question data model and author
editing pages after persistence.

## Phase 0: Research

Research is captured in [research.md](./research.md). All technical choices from
the planning stage are resolved.

## Phase 1: Design & Contracts

- Data model: [data-model.md](./data-model.md)
- API/UI contracts: [contracts/api.md](./contracts/api.md)
- Quickstart validation: [quickstart.md](./quickstart.md)

## Phase 2: Execution Strategy

1. Build and test the CSV parser independently.
2. Build the author-scoped import service with service-role persistence guarded
   by admin authorization at the route boundary.
3. Add the admin route contract and integration tests.
4. Add the modal and wire the `Importar` button beside `Editar`.
5. Verify imported drafts appear in the existing author question list and remain
   unpublished until the author publishes them.
6. Add template download, E2E smoke, docs update, and full quality gates.

## Complexity Tracking

No constitution violations identified.
