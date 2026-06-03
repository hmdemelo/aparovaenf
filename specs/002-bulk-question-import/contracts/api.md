# API and UI Contracts: Bulk Question Import

This contract follows the existing API response envelope.

## POST `/api/admin/authors/{author_id}/questions/bulk-import`

Purpose: Import CSV question rows as draft questions owned by the selected
author.

Authorization:

- Requires authenticated admin.
- Non-admin callers receive the standard forbidden response.

Path parameters:

- `author_id`: UUID of the selected author profile.

Request:

- `multipart/form-data`
- Field `file`: required CSV file.

Limits:

- File type: `.csv`
- Encoding: UTF-8
- Maximum size: 5 MB
- Maximum rows: 500 data rows

Success response:

```json
{
  "success": true,
  "data": {
    "author_id": "00000000-0000-0000-0000-000000000001",
    "file_name": "questoes.csv",
    "total_rows": 10,
    "imported": 8,
    "failed": 2,
    "created_question_ids": [
      "00000000-0000-0000-0000-000000000101"
    ],
    "errors": [
      {
        "line": 4,
        "field": "subject",
        "message": "Disciplina nao encontrada para a carreira informada."
      }
    ]
  }
}
```

Validation error response:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION",
    "message": "Arquivo CSV invalido."
  }
}
```

Rules:

- The route must validate admin access before reading or persisting rows.
- The route must validate the author exists before parsing persistence-ready
  rows.
- Valid rows create `draft` questions and ordered alternatives.
- Invalid rows are reported with line numbers.
- If every row is invalid, the route returns success with `imported: 0` and row
  errors, unless the file itself violates global constraints.
- The route never publishes questions.

## GET `/api/admin/questions/bulk-template`

Purpose: Provide the current CSV template for admin import.

Authorization:

- Requires authenticated admin.

Response:

- `text/csv; charset=utf-8`
- Download filename: `template-importacao-questoes.csv`

Required template columns:

```csv
career;subject;difficulty;statement;alt_a;alt_b;alt_c;alt_d;alt_e;correct;general_comment;source_type;board;source_orgao;source_cargo;source_year;source_reference;comment_a;comment_b;comment_c;comment_d;comment_e
```

## Admin Authors UI Contract

Location:

- `/admin/authors`

Author row actions:

- Existing `Editar` action remains.
- New `Importar` action appears beside `Editar`.

Import modal behavior:

- Shows the selected author name.
- Shows CSV constraints and template access.
- Allows selecting one CSV file.
- Disables submit while upload is in progress.
- Shows imported count, failed count, and up to 50 row-level errors after the
  response.
- Calls page refresh after a successful response with `imported > 0`.
- Closing the modal must not re-submit the file.

## CSV Header Compatibility Contract

The parser accepts normalized headers for compatible columns from
`docs/bulk-question-import.md`:

- `statement`: `stem`, `enunciado`
- `alt_a`: `alta`, `alternativaa`, `a`
- `alt_b`: `altb`, `alternativab`, `b`
- `alt_c`: `altc`, `alternativac`, `c`
- `alt_d`: `altd`, `alternativad`, `d`
- `alt_e`: `alte`, `alternativae`, `e`
- `correct`: `correta`, `respostacorreta`, `gabarito`
- `subject`: `materia`, `disciplina`
- `source_reference`: `source`, `fonte`, `origem`
- `source_year`: `year`, `ano`
- `general_comment`: `commentary`, `comentario`

The current feature additionally requires:

- `career`: `carreira`
- `difficulty`: `dificuldade`
