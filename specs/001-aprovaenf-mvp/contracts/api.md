# API and UI Contracts: aprovaenf MVP

This contract documents expected server-side interfaces. Exact implementation may
use Route Handlers, Server Actions, or a mix, but behavior must remain stable.

## Shared Response Envelope

Success:

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "string",
    "message": "string"
  }
}
```

## Student Feed

### GET `/api/feed/next`

Purpose: Return the next eligible question for the current anonymous session or
authenticated user.

Inputs:

- `career`
- `board` optional

Rules:

- Must not return unpublished questions.
- Must respect trial limits.
- Must not consume trial until answer submission.

Success data:

- question id
- statement
- alternatives without correctness flag
- classification summary
- source display fields when available

### POST `/api/answers`

Purpose: Submit an answer and return feedback.

Body:

- `question_id`
- `alternative_id`
- `anonymous_session_id` optional

Rules:

- Must consume trial only once per submitted answer.
- Must return correctness and comments.
- Must record `question_answered`.

Success data:

- `is_correct`
- `correct_alternative_id`
- `general_comment`
- `selected_alternative_comment` optional
- `trial_status`

## Trial and Access

### GET `/api/trial/status`

Purpose: Return current access state.

Success data:

- `answered_before_signup`
- `answered_after_signup`
- `total_free_answered`
- `signup_required`
- `paywall_required`
- `subscription_active`

## Favorites

### POST `/api/favorites`

Purpose: Save a favorite for active subscribers.

Rules:

- Must reject non-subscribers without persisting.
- Must record `favorite_attempted`.
- Must record `favorite_saved` on success.

### DELETE `/api/favorites/:question_id`

Purpose: Remove a saved favorite.

### GET `/api/favorites`

Purpose: List subscriber favorites.

## Author Questions

### GET `/api/author/questions`

Purpose: List questions owned by the authenticated author.

### POST `/api/author/questions`

Purpose: Create a draft question.

Validation:

- Statement required.
- Career required.
- Subject required.
- Difficulty required.
- Alternatives variable but at least two for publish.

### PATCH `/api/author/questions/:id`

Purpose: Edit an owned question.

Rules:

- Author cannot edit another author's question.

### POST `/api/author/questions/:id/publish`

Purpose: Publish a valid author-owned question.

Validation:

- General comment required.
- Exactly one correct alternative.
- At least two alternatives.

## Admin

### GET `/api/admin/users`

Purpose: List users with role, trial, and subscription status.

### GET `/api/admin/questions`

Purpose: List all questions with author, status, and metrics.

### POST `/api/admin/questions/:id/unpublish`

Purpose: Remove a question from feed eligibility.

### GET `/api/admin/metrics`

Purpose: Return basic launch funnel and content metrics.

## Billing

### POST `/api/billing/checkout`

Purpose: Create monthly or annual checkout.

Body:

- `plan`: `monthly` or `annual`

Rules:

- monthly price: R$ 29,90
- annual price: R$ 287,00
- must record `checkout_started`

### POST `/api/webhooks/abacate-pay`

Purpose: Receive payment events and activate subscription.

Rules:

- Validate provider signature/secret when available.
- Process idempotently by provider event id.
- Never expose provider secret to browser.
- Record processing status and errors.
