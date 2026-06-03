# Quickstart Validation: Bulk Question Import

## 1. Local Setup

1. Install dependencies.
2. Copy `.env.example` to `.env.local` if needed.
3. Start Supabase local.
4. Run database migrations and seed.
5. Start the Next.js dev server.

## 2. Sample CSV

```csv
career;subject;difficulty;statement;alt_a;alt_b;alt_c;correct;general_comment;source_type;source_year
Enfermeiro(a);Saude Publica e SUS;facil;"Qual principio do SUS garante atendimento sem discriminacao?";Universalidade;Integralidade;Equidade;A;"Universalidade garante acesso a todos.";autoral;
Enfermeiro(a);Saude Publica e SUS;media;"Questao sem gabarito ainda";Alternativa A;Alternativa B;Alternativa C;;"Autor revisara antes de publicar.";autoral;
```

Expected behavior:

- Both rows import as drafts for the selected author.
- The first row has alternative A marked as correct.
- The second row remains a draft without a correct alternative and cannot be
  published until the author completes it.

## 3. Admin Smoke

1. Log in as `admin@aprovaenf.local`.
2. Open `/admin/authors`.
3. Click `Importar` beside a seeded author.
4. Upload the sample CSV.
5. Confirm the modal shows imported count and no global failure.
6. Upload a CSV with an unknown subject and confirm the row-level error appears.

## 4. Author Smoke

1. Log in as the author selected during admin import.
2. Open `/author/questions`.
3. Confirm imported questions appear as drafts.
4. Open one imported draft and save an edit.
5. Try publishing an incomplete imported draft and confirm existing validation
   blocks publication.

## 5. Quality Gates

Run before merge:

```bash
npm run typecheck
npm run lint
npm run test
npm run test:integration
npm run test:e2e
npm run build
```
