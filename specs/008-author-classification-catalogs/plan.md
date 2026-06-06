# Implementation Plan: Catálogos de Classificação para Autores

**Branch**: `008-author-classification-catalogs` | **Date**: 2026-06-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-author-classification-catalogs/spec.md`

## Summary

Criar um modal compartilhado no editor de questões para autores consultarem,
pesquisarem, paginarem, cadastrarem e selecionarem disciplinas, assuntos e
bancas. A solução evolui os catálogos existentes em vez de introduzir tabelas
paralelas: `subjects` permanece como disciplina, `tags` passa a representar
assuntos vinculados a uma disciplina e `boards` permanece como banca.

Os catálogos serão globais, com origem de cadastro auditável. Novas APIs de
autor aplicarão autenticação, validação e paginação no servidor. O editor passará
a persistir assuntos por identificador, substituindo a criação implícita por nome
livre. O banco manterá restrições de unicidade para resolver cadastros
concorrentes sem duplicação.

## Technical Context

**Language/Version**: TypeScript 5, React 19, Next.js 16 App Router  
**Primary Dependencies**: Next.js Route Handlers, Supabase JS/SSR, Zod 4, Lucide React, Tailwind CSS 4  
**Storage**: Supabase Postgres with Row Level Security  
**Testing**: Vitest, Testing Library, Playwright  
**Target Platform**: Vercel web application, responsive from 320px desktop/mobile browsers  
**Project Type**: Modular full-stack web monolith  
**Performance Goals**: Search and pagination responses below 1 second for up to 10,000 records per catalog; 20 records per page  
**Constraints**: No new service, cache, realtime channel or search engine; no private per-author catalogs; no production-data destructive tests  
**Scale/Scope**: Three shared catalogs, one authoring modal, three paginated API resources, existing question editor and admin discipline screen

## Constitution Check

### Pre-Design Gate

- **Mobile-First Learning Value — PASS**: The feature is staff-facing, but the
  modal is required to remain usable from 320px and must not make authoring
  depend on desktop.
- **Secure Data Boundaries — PASS**: Every list/create route resolves an author
  or admin server-side, validates input with schemas and uses RLS-compatible
  writes. Creator e-mail is never returned.
- **Test-First Delivery — PASS**: Unit tests cover normalization, pagination,
  conflict mapping and editor state. Integration tests cover authorization,
  catalog queries and database constraints. Playwright covers the complete
  create/select/publish workflow.
- **Simple Modular Architecture — PASS**: The implementation extends the
  existing Next.js/Supabase monolith and the existing catalog tables.
- **Observable Operations — PASS**: Successful and failed catalog creation
  attempts generate product events and structured server logs.

### Post-Design Gate

The design remains within the existing monolith, adds no infrastructure and
uses database uniqueness plus RLS as the authoritative concurrency/security
boundary. No constitutional exception is required.

## Project Structure

### Documentation (this feature)

```text
specs/008-author-classification-catalogs/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
app/
├── (author)/author/questions/
│   ├── new/page.tsx
│   └── [id]/edit/page.tsx
├── (admin)/admin/subjects/page.tsx
└── api/author/
    ├── disciplines/route.ts
    ├── topics/route.ts
    └── boards/route.ts

features/
├── authors/
│   ├── classification-catalog-dialog.tsx
│   ├── classification-catalog-service.ts
│   ├── classification-options.ts
│   ├── question-editor.tsx
│   └── author-question-service.ts
└── admin/
    ├── create-subject-form.tsx
    └── subject-service.ts

lib/
├── db/database.types.ts
├── text/slugify.ts
└── validation/schemas.ts

supabase/migrations/
├── 010_author_classification_catalogs_additive.sql
└── 011_author_topics_scoped_uniqueness.sql

tests/
├── unit/
│   ├── classification-catalog-dialog.test.ts
│   ├── classification-catalog-service.test.ts
│   └── question-editor.test.ts
├── integration/
│   └── author-classification-catalogs.test.ts
└── e2e/
    └── author-classification-catalogs.spec.ts
```

**Structure Decision**: Manter o monólito modular existente. Regras de consulta,
criação, conflito e auditoria ficam em `features/authors`; Route Handlers apenas
resolvem contexto, validam entrada e traduzem o resultado para o envelope HTTP.
O modal é um componente dedicado, e o editor continua proprietário do estado da
questão e das seleções.

## Implementation Strategy

### Phase 1 - Database Contract and Types

1. Add compatibility migration
   `010_author_classification_catalogs_additive.sql`.
2. Add `created_by_kind` and nullable `created_by_author_id` to `subjects`,
   `tags`, and `boards`; avoid storing private auth user IDs in public-readable
   catalog rows.
3. Add nullable `subject_id` to legacy `tags`; require it in new application
   writes while preserving existing rows for migration compatibility.
4. Backfill `tags.subject_id` only when all associated questions point to one
   discipline. Leave multi-discipline and unassociated legacy tags unclassified
   during the compatibility deployment.
5. Keep the existing global tag uniqueness during the compatibility deployment.
6. Add indexes for subject hierarchy, creator attribution, deterministic sort,
   and normalized substring search.
7. Add or tighten insert policies so authors can only attribute records to
   their own public author profile and admins can only use the administration
   origin. Keep catalog reads globally available under existing policies.
8. Regenerate `lib/db/database.types.ts`.

### Phase 2 - Domain Service and API Contracts

1. Add Zod schemas for list query parameters and create payloads.
2. Implement a catalog service with one shared pagination primitive and
   resource-specific mapping for disciplines, topics, and boards.
3. Normalize search terms with the existing `slugify()` helper and query the
   normalized slug field.
4. Return creator labels using only `author_profiles.display_name`; represent
   legacy rows as `Sistema` and admin-created rows without author profile as
   `Administração`.
5. Map uniqueness violations to a typed domain conflict containing the existing
   record; the route returns that record as a successful reusable selection
   instead of leaking the database error.
6. Create authenticated GET/POST handlers for each catalog resource, using a
   catalog-manager context that permits authors and admins even when an admin
   has no `author_profiles` row.
7. Record `author_catalog_item_created` and
   `author_catalog_item_create_failed` operational events through a
   server-controlled event writer.

### Phase 3 - Modal and Editor Integration

1. Build `ClassificationCatalogDialog` with tabs for Disciplina, Assunto and
   Banca, a single search field at the top, paginated rows, creator/context
   labels and type-specific creation forms.
2. Use stable modal dimensions with an internal scroll area so loading, empty
   and error states do not resize the dialog.
3. Add numbered pagination with previous/next controls and a maximum compact
   page-number window on mobile.
4. Open the modal from the classification block of both new and edit flows.
5. Apply selected discipline and board directly to editor state; append selected
   topics without duplicates.
6. Replace free-text tag payloads with `topic_ids`.
7. When discipline changes, detect incompatible selected topics and request
   explicit confirmation before clearing them.
8. Preserve all unsaved question fields while opening, searching, creating,
   selecting or closing the modal.

### Phase 4 - Compatibility and Terminology

1. Update question loading/saving to read and persist topic identifiers through
   `question_tags`.
2. Validate server-side that every newly selected topic belongs to the selected
   discipline. During the compatibility window, preserve an already-associated
   legacy topic with null discipline, but never offer it for a new selection.
3. Replace visible `Tags (subassuntos)` wording with `Assuntos`.
4. Rename the admin-facing `Assuntos` page/content to `Disciplinas` while
   preserving the existing route initially to avoid breaking bookmarks.
5. Deprecate the old `/api/tags` autocomplete and `/api/boards` inline-create
   paths after all editor consumers use the new authenticated catalog APIs.
6. After the new ID-based editor is deployed, apply
   `011_author_topics_scoped_uniqueness.sql` to replace global tag uniqueness
   with `(subject_id, slug)`, split multi-discipline legacy tags into one topic
   per discipline, rewire `question_tags`, and add a partial legacy uniqueness
   rule.
7. Remove the temporary null-discipline preservation branch after migration 011
   parity is confirmed.

### Phase 5 - Test-First Verification

1. Unit-test normalization, page bounds, creator labels, duplicate conflict
   recovery, topic/discipline compatibility and modal state transitions.
2. Integration-test RLS authorization, shared visibility, exact page size,
   accent-insensitive search, hierarchy constraints and concurrent duplicate
   creation.
3. E2E-test author creation of a discipline, topic and board, selection in the
   editor, draft persistence and publication.
4. Verify mobile layouts at 320px and desktop layouts with Playwright
   screenshots and accessibility checks.
5. Run `npm run typecheck`, `npm run lint`, `npm test`,
   `npm run test:integration`, targeted Playwright suites and `npm run build`.
6. Apply both rollout stages through separate dry runs and confirm local/remote
   migration history before and after the compatibility deploy.
