# Quickstart: Catálogos de Classificação para Autores

## Prerequisites

- Node dependencies installed.
- Supabase CLI linked to the intended project.
- Local Supabase running for database-writing integration tests.
- An authenticated author fixture and at least one career.

## Recommended Implementation Order

1. Write unit tests for pagination, normalization, conflict handling and
   topic/discipline validation.
2. Add and apply `010_author_classification_catalogs_additive.sql` locally.
3. Regenerate database types.
4. Implement catalog schemas and domain service.
5. Add GET/POST author APIs.
6. Build the modal with mocked API tests.
7. Replace free-form tag names with selected topic IDs in the editor.
8. Add `011_author_topics_scoped_uniqueness.sql` and test the staged rollout.
9. Add integration and E2E coverage.
10. Run full verification before remote migration/deploy.

## Local Migration

```bash
npx supabase migration list
npx supabase db reset
```

Do not run database-writing tests against production users. If Docker is not
available, run unit/UI tests and defer integration/E2E database writes until the
local Supabase environment is available.

## Automated Verification

```bash
npm run typecheck
npm run lint
npm test
npm run test:integration
npx playwright test tests/e2e/author-classification-catalogs.spec.ts
npm run build
```

## Manual Verification

1. Sign in as an author and open a draft question with missing classification.
2. Open `Gerenciar classificações`.
3. Search existing disciplines with and without accents.
4. Navigate through numbered pages.
5. Create a discipline under the question career and select it.
6. Create two assuntos under that discipline and associate both.
7. Create or select a banca.
8. Save the draft, reload and confirm all selected IDs persist.
9. Change discipline and confirm the incompatible-assunto warning.
10. Complete the remaining publish requirements and publish the question.
11. Repeat the modal flow at 320px viewport and verify there is no horizontal
    overflow or content overlap.

## Remote Rollout

1. Review `git diff` and security-sensitive RLS changes.
2. Run:

```bash
npx supabase db push --dry-run
```

3. Confirm only migration `010` appears and apply it.
4. Deploy the ID-based application code.
5. Dry-run and apply migration `011`.
6. Verify migration parity with `npx supabase migration list`.
7. Monitor catalog creation failures and conflict counts in application logs.
