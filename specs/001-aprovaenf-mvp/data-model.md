# Data Model: aprovaenf MVP

## UserProfile

- `id`: auth user id.
- `role`: `student`, `author`, or `admin`.
- `name`
- `email`
- `created_at`
- `updated_at`

Relationships:

- One user may have one AuthorProfile.
- One user may have many AnswerAttempts, Favorites, Subscriptions, ProductEvents.

Validation:

- Email must be valid and unique through auth.
- Role changes require admin authorization.

## AuthorProfile

- `id`
- `user_id`
- `display_name`
- `short_bio`
- `photo_url`
- `instagram`
- `is_public`
- `created_at`
- `updated_at`

Relationships:

- Belongs to UserProfile.
- Owns Questions.

## Career

- `id`
- `name`
- `slug`
- `is_launch_career`

Initial values:

- Enfermagem
- Tecnico em enfermagem

## Board

- `id`
- `name`
- `slug`
- `is_priority`

Initial priority boards:

- IDIB
- IDECAN
- FGV
- Instituto AOCP
- IBFC
- Consulplan

## Subject

- `id`
- `career_id`
- `name`
- `slug`

Used for classification from day one, even if subject filter is not prominent in
the first release.

## Question

- `id`
- `author_id`
- `career_id`
- `board_id` optional
- `subject_id`
- `difficulty`: `facil`, `media`, `dificil`
- `source_type`: `autoral` or `prova_oficial`
- `source_orgao` optional
- `source_cargo` optional
- `source_year` optional
- `source_reference` optional
- `statement`
- `general_comment`
- `status`: `draft`, `published`, `unpublished`, `archived`
- `annulled`: boolean
- `answer_key_changed`: boolean
- `created_at`
- `updated_at`
- `published_at`

Validation:

- Published questions require statement, general comment, at least two
  alternatives, one correct alternative, career, subject, difficulty, author.
- Official exam questions should store source details when available.

## Alternative

- `id`
- `question_id`
- `label`
- `text`
- `is_correct`
- `alternative_comment` optional
- `position`

Validation:

- Each question must have exactly one correct alternative for MVP.
- Alternative comments are optional.

## AnswerAttempt

- `id`
- `user_id` optional for anonymous pre-signup attempt
- `anonymous_session_id` optional
- `question_id`
- `selected_alternative_id`
- `is_correct`
- `career_id`
- `board_id` optional
- `answered_at`

Rules:

- Only answered questions consume trial.
- Anonymous attempts count toward the 2-question pre-signup limit.
- Registered non-subscriber attempts count toward the 5-question total trial.

## Favorite

- `id`
- `user_id`
- `question_id`
- `created_at`

Rules:

- Only active subscribers can persist favorites.
- Non-subscriber favorite attempts generate a product event and prompt.

## Subscription

- `id`
- `user_id`
- `plan`: `monthly` or `annual`
- `status`: `pending`, `active`, `past_due`, `canceled`, `expired`
- `provider`: `abacate_pay`
- `provider_customer_id`
- `provider_subscription_id`
- `current_period_start`
- `current_period_end`
- `created_at`
- `updated_at`

Rules:

- Feed unlock depends on active subscription.
- Server-side webhook is source of truth.

## PaymentEvent

- `id`
- `provider`
- `provider_event_id`
- `event_type`
- `payload`
- `processed_at`
- `processing_status`
- `error_message` optional
- `created_at`

Rules:

- `provider_event_id` must be unique for idempotency.

## ProductEvent

- `id`
- `user_id` optional
- `anonymous_session_id` optional
- `event_name`
- `career_id` optional
- `question_id` optional
- `metadata`
- `created_at`

Initial events:

- `landing_viewed`
- `career_selected`
- `question_viewed`
- `question_answered`
- `signup_required_shown`
- `signup_completed`
- `trial_finished`
- `checkout_started`
- `subscription_activated`
- `favorite_attempted`
- `favorite_saved`

## State Transitions

Question:

- `draft` -> `published`
- `published` -> `unpublished`
- `unpublished` -> `published`
- any non-deleted state -> `archived`

Subscription:

- `pending` -> `active`
- `active` -> `past_due`
- `active` -> `canceled`
- `past_due` -> `active`
- `past_due` -> `expired`

Student access:

- anonymous visitor -> signup required after 2 answered questions.
- registered non-subscriber -> paywall after 5 total free answered questions.
- active subscriber -> unlocked feed, favorites, error history.
