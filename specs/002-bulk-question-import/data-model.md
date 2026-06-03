# Data Model: Bulk Question Import

## BulkImportSession

Represents one upload attempt made by an admin for a selected author.

- `id`: optional generated identifier for logs and UI correlation.
- `admin_user_id`: authenticated admin who initiated the upload.
- `author_id`: selected `AuthorProfile` receiving imported drafts.
- `file_name`: original CSV file name.
- `file_size`: uploaded file size in bytes.
- `total_rows`: CSV data row count after header parsing.
- `imported_rows`: count of rows persisted as drafts.
- `failed_rows`: count of invalid or failed rows.
- `created_question_ids`: identifiers for questions created during the session.
- `errors`: row-level errors.
- `created_at`: timestamp for audit/debugging.

Validation:

- Requires an authenticated admin.
- Requires an existing author profile.
- File must be CSV, UTF-8, at most 5 MB, and at most 500 data rows.

Persistence:

- A dedicated table is not required for the first slice. The session can be
  represented in the route response and server logs/product events.

## ParsedQuestionRow

Normalized representation of one CSV row before persistence.

- `line`: 1-based CSV line number including the header line.
- `career_name`: required, matched to an existing career.
- `subject_name`: required, matched within the selected career.
- `board_name`: optional, matched to an existing board.
- `difficulty`: required, one of `facil`, `media`, or `dificil`.
- `source_type`: optional, defaults to `autoral`; supports `autoral` and
  `prova_oficial`.
- `source_orgao`: optional official-source metadata.
- `source_cargo`: optional official-source metadata.
- `source_year`: optional official-source metadata.
- `source_reference`: optional source URL/reference.
- `statement`: required question stem.
- `general_comment`: optional draft-level explanation.
- `correct_label`: optional answer key A-E.
- `alternatives`: two to five ordered alternatives.

Validation:

- Statement, career, subject, difficulty, and at least two alternatives are
  required.
- Correct answer is optional for draft import. If present, it must point to a
  non-empty alternative.
- Source year must be an integer from 1900 through 2100 when present.
- Career, subject, board, difficulty, and source type must resolve to allowed
  current-system values.

## QuestionDraft

Existing `Question` entity created from a valid `ParsedQuestionRow`.

- `author_id`: selected author.
- `career_id`: resolved career.
- `subject_id`: resolved subject.
- `board_id`: resolved board or null.
- `difficulty`: normalized difficulty.
- `source_type`: normalized source type.
- `source_orgao`, `source_cargo`, `source_year`, `source_reference`: optional.
- `statement`: CSV statement.
- `general_comment`: CSV general comment or null.
- `status`: always `draft`.

State transitions:

```text
CSV valid row -> draft -> existing author edit flow -> published
                         -> existing author edit flow -> remains draft
```

Rules:

- Import never creates `published` questions.
- Existing author publish validation remains authoritative.

## AlternativeDraft

Existing `Alternative` rows created for each imported question.

- `question_id`: created draft question.
- `label`: A, B, C, D, or E.
- `text`: required when the alternative is present.
- `is_correct`: true only for the optional matching correct label.
- `alternative_comment`: optional row value when supported.
- `position`: stable zero-based position matching A-E order.

Rules:

- At least two alternatives are required for imported drafts.
- At most one imported alternative can be marked correct.
