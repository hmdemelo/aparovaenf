# API and UI Contracts: Catálogos de Classificação para Autores

All endpoints use the existing success/error envelope.

## Shared Authorization

- Caller must have an authenticated `author` or `admin` profile.
- Unauthenticated requests return `401 unauthenticated`.
- Other roles return `403 forbidden`.
- Create operations set the creator from the authenticated server context; the
  browser cannot choose creator-origin fields.

## Shared Pagination Response

```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 42,
      "total_pages": 3
    }
  }
}
```

Query parameters:

- `q`: optional normalized substring query, maximum 80 characters.
- `page`: integer, minimum 1, default 1.
- `page_size`: integer, minimum 1, maximum 20, default 20.

If a requested page exceeds the available total, return an empty `items` array
with the requested page and current totals.

## GET `/api/author/disciplines`

Additional query:

- `career_id`: optional UUID filter.

Item:

```json
{
  "id": "uuid",
  "name": "Terapia Intensiva",
  "career": {
    "id": "uuid",
    "name": "Enfermeiro(a)"
  },
  "created_by": {
    "label": "Martinho Alves",
    "is_current_user": false
  },
  "created_at": "2026-06-05T12:00:00.000Z"
}
```

## POST `/api/author/disciplines`

Request:

```json
{
  "name": "Terapia Intensiva",
  "career_id": "uuid"
}
```

Created: `201` with `created: true` and the created item.

Equivalent existing record: `200` with `created: false` and the existing item:

```json
{
  "success": true,
  "data": {
    "created": false,
    "item": {
      "id": "uuid",
      "name": "Terapia Intensiva"
    }
  }
}
```

The service still models the uniqueness violation as a typed conflict internally,
but the HTTP contract returns the reusable existing record directly.

## GET `/api/author/topics`

Additional query:

- `discipline_id`: optional UUID filter.

Item:

```json
{
  "id": "uuid",
  "name": "Ventilação mecânica",
  "discipline": {
    "id": "uuid",
    "name": "Terapia Intensiva"
  },
  "career": {
    "id": "uuid",
    "name": "Enfermeiro(a)"
  },
  "created_by": {
    "label": "Você",
    "is_current_user": true
  },
  "created_at": "2026-06-05T12:00:00.000Z"
}
```

## POST `/api/author/topics`

Request:

```json
{
  "name": "Ventilação mecânica",
  "discipline_id": "uuid"
}
```

Created: `201` with `created: true`. Duplicate within the same discipline:
`200` with `created: false` and the existing item.

## GET `/api/author/boards`

No additional filters.

Item:

```json
{
  "id": "uuid",
  "name": "IDECAN",
  "created_by": {
    "label": "Sistema",
    "is_current_user": false
  },
  "created_at": "2026-06-05T12:00:00.000Z"
}
```

## POST `/api/author/boards`

Request:

```json
{
  "name": "IDECAN"
}
```

Created: `201` with `created: true`. Global duplicate: `200` with
`created: false` and the existing item.

## Question Editor Payload

Create/update question payload replaces free-form `tags` with:

```json
{
  "career_id": "uuid-or-null",
  "subject_id": "uuid-or-null",
  "board_id": "uuid-or-null",
  "topic_ids": ["uuid"]
}
```

Rules:

- Maximum 20 topic identifiers.
- Duplicate identifiers are rejected or deduplicated before persistence.
- Every topic must belong to `subject_id`.
- Drafts may save without classification.
- Publish still requires career, discipline and difficulty.

## Modal UI Contract

- Dialog title: `Gerenciar classificações`.
- Tabs: `Disciplinas`, `Assuntos`, `Bancas`.
- Search remains at the top below the tab control.
- Create action uses a plus icon with tooltip and accessible label.
- List body has a stable height and internal scroll.
- Each row shows name, hierarchy context and creator label.
- Pagination appears below the list and never causes horizontal overflow.
- Selecting a discipline or banca closes the dialog and updates the field.
- Selecting an assunto keeps the dialog open for additional selection until the
  author confirms.
- Closing the dialog without confirming assunto changes preserves the prior
  editor selection.
- Search, page and creation errors are shown inside the dialog without clearing
  unsaved question content.
