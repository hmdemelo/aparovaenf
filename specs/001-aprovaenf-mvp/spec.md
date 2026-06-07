# Feature Specification: aprovaenf MVP

**Feature Branch**: `001-aprovaenf-mvp`  
**Created**: 2026-06-01  
**Status**: Draft  
**Input**: Consolidated product, voting, and technical decisions in `docs/`

> **Payment scope note (2026-06-07):** provider-specific references to Abacate
> Pay in this original MVP specification are superseded by
> `specs/006-stripe-migration/spec.md`. The implemented launch flow is Stripe
> Checkout with recurring card payments.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Student completes trial learning loop (Priority: P1)

As a visitor or student, I want to choose my career and answer a short sequence
of commented questions so that I can feel the value of aprovaenf before paying.

**Why this priority**: This is the product's core promise and the conversion
entry point.

**Independent Test**: A visitor selects Enfermagem or Tecnico em enfermagem,
answers 2 questions, is asked to create an account, answers 3 more questions
after signup, and reaches the subscription gate.

**Acceptance Scenarios**:

1. **Given** a visitor has not answered questions, **When** they select a career,
   **Then** the system starts a one-question-at-a-time feed.
2. **Given** a visitor has answered 2 questions, **When** they request the next
   question, **Then** the system requires signup before continuing.
3. **Given** a registered non-subscriber has answered 5 total free questions,
   **When** they request another question, **Then** the system shows the
   subscription offer.
4. **Given** a student answers a question, **When** the answer is submitted,
   **Then** the system shows correctness, the required general comment, optional
   alternative comment when present, and a next action.

---

### User Story 2 - Author publishes commented questions (Priority: P1)

As an author, I want to create, edit, classify, and publish questions with
alternatives and comments so that students receive high-quality content.

**Why this priority**: The platform has no value without author-managed question
content.

**Independent Test**: An author logs in, creates a question with required fields,
adds variable alternatives, marks the correct answer, writes a general comment,
optionally writes alternative comments, publishes it, and sees it available in
the student feed.

**Acceptance Scenarios**:

1. **Given** an author is authenticated, **When** they create a question without
   a general comment, **Then** publication is blocked.
2. **Given** an author provides a valid question and alternatives, **When** they
   publish it, **Then** the question becomes eligible for the feed.
3. **Given** an author owns a question, **When** they edit it, **Then** the
   system preserves ownership and updates the visible content.

---

### User Story 3 - Subscriber unlocks paid access (Priority: P1)

As a trial student, I want to subscribe monthly or annually so that I can
continue answering questions and unlock subscriber features.

**Why this priority**: Subscription is the business model and must work before
production launch.

**Independent Test**: A trial-ended account starts checkout, payment is confirmed
server-side, subscription becomes active, and the feed unlocks.

**Acceptance Scenarios**:

1. **Given** a non-subscriber reaches the paywall, **When** they choose monthly,
   **Then** checkout starts for R$ 29,90.
2. **Given** a non-subscriber reaches the paywall, **When** they choose annual,
   **Then** checkout starts for R$ 287,00 with parceling available through
   Abacate Pay.
3. **Given** Abacate Pay confirms payment server-side, **When** the webhook is
   processed, **Then** the account becomes subscribed.

---

### User Story 4 - Subscriber uses retention features (Priority: P2)

As a subscriber, I want favorites and error history so that I can review weak
points and important questions.

**Why this priority**: Retention features increase value after conversion but do
not block the core trial.

**Independent Test**: A subscriber favorites a question and sees it later; a
non-subscriber attempts the same action and the favorite does not persist.

**Acceptance Scenarios**:

1. **Given** a subscriber answers a question, **When** they favorite it, **Then**
   the favorite persists in their account.
2. **Given** a non-subscriber tries to favorite, **When** they leave or refresh,
   **Then** the favorite is not persisted and a subscription prompt is shown.
3. **Given** a subscriber answers incorrectly, **When** they open error history,
   **Then** the incorrect question appears with its result and comment.

---

### User Story 5 - Admin operates the platform (Priority: P2)

As an admin, I want to manage users, authors, questions, subscriptions, and
basic metrics so that the launch can be operated safely.

**Why this priority**: Admin control is needed for production reliability and
content moderation.

**Independent Test**: An admin can list users, inspect questions, unpublish
problematic content, verify subscription status, and see core funnel metrics.

**Acceptance Scenarios**:

1. **Given** an admin sees a problematic question, **When** they unpublish it,
   **Then** it disappears from the student feed.
2. **Given** an admin opens a student profile, **When** the page loads, **Then**
   trial and subscription status are visible.
3. **Given** product events exist, **When** admin opens metrics, **Then** basic
   trial and conversion counts are visible.

---

### User Story 6 - Public landing converts visitors (Priority: P3)

As a visitor, I want a clear landing page that explains the offer, trial, and
pricing so that I trust the product enough to start the free trial.

**Why this priority**: Landing improves acquisition but the feed experience is
the primary proof of value.

**Independent Test**: A visitor sees the aprovaenf offer, pricing, trial rules,
and starts the feed.

**Acceptance Scenarios**:

1. **Given** a visitor lands on the home page, **When** they scan the first
   viewport, **Then** they understand the product is for concursos da saude.
2. **Given** a visitor wants to try, **When** they choose a career, **Then** the
   trial begins without requiring signup first.

### Edge Cases

- A visitor reloads after answering 1 or 2 anonymous questions.
- A registered non-subscriber attempts to review trial questions after trial
  completion.
- A question has no alternative-level comments.
- A question has variable alternative count.
- A published question is later unpublished while a student is in the feed.
- A payment webhook is delivered more than once.
- Abacate Pay checkout return is reached before webhook confirmation.
- An author attempts to edit another author's question.
- A question from an official exam is annulled or has changed answer key.
- The random feed has too few eligible questions for selected filters.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST let visitors choose Enfermagem or Tecnico em
  enfermagem before starting the trial feed.
- **FR-002**: The system MUST keep Banca optional at trial start and inside the
  platform.
- **FR-003**: The system MUST count answered questions, not merely viewed
  questions, toward the trial limit.
- **FR-004**: The system MUST allow exactly 2 answered questions before signup.
- **FR-005**: The system MUST allow exactly 3 additional answered questions after
  signup for non-subscribers.
- **FR-006**: The system MUST block further non-subscriber use after 5 free
  answered questions.
- **FR-007**: The system MUST show the general comment after every answered
  trial question.
- **FR-008**: The system MUST support optional alternative-level comments.
- **FR-009**: The system MUST not persist favorites for non-subscribers.
- **FR-010**: The system MUST persist favorites for subscribers.
- **FR-011**: The system MUST provide error history only to subscribers.
- **FR-012**: The system MUST support monthly and annual subscription offers.
- **FR-013**: The system MUST activate subscription only after server-side
  payment confirmation.
- **FR-014**: The system MUST process payment webhooks idempotently.
- **FR-015**: Authors MUST be able to create, edit, classify, and publish their
  own questions.
- **FR-016**: Authors MUST provide a general comment before publishing.
- **FR-017**: Authors MUST be able to leave alternative-level comments empty.
- **FR-018**: Questions MUST support variable numbers of alternatives.
- **FR-019**: Questions MUST include career, subject, difficulty, source type,
  status, and author.
- **FR-020**: Official exam questions MUST store source details when available:
  banca, orgao, cargo, year, and source URL or reference.
- **FR-021**: Admins MUST be able to unpublish problematic questions.
- **FR-022**: Admins MUST be able to view user trial and subscription status.
- **FR-023**: The system MUST record product events for the minimum funnel.
- **FR-024**: The application MUST work on smartphone, tablet, and desktop.
- **FR-025**: Smartphone and tablet navigation MUST support swipe to next
  question after answer/comment.
- **FR-026**: Desktop navigation MUST provide a clear next button.
- **FR-027**: The landing page MUST avoid promising IA, ranking, simulados,
  mapas mentais, or personalized plans in the MVP.
- **FR-028**: Admins MUST be able to provision new authors from `/admin/authors`
  through a dialog/modal instead of a fixed top form.
- **FR-029**: Admins MUST be able to edit author profile fields from
  `/admin/authors`: display name, short bio, Instagram, and public visibility.
- **FR-030**: Desktop and tablet admin/author panels MUST use a centered
  35px-margin frame, fixed left sidebar, logout at the sidebar footer, and a
  white right content panel with independent vertical scrolling.

### Key Entities

- **User**: A person using the system as student, author, or admin.
- **AuthorProfile**: Public and operational profile for a nurse/author.
- **Question**: The enunciado, classification, source, status, and ownership.
- **Alternative**: A selectable answer option tied to a question.
- **AnswerAttempt**: A student's submitted answer and result.
- **Favorite**: A subscriber's saved question.
- **Subscription**: A user's paid access state.
- **PaymentEvent**: External payment event used to activate subscriptions.
- **ProductEvent**: Internal analytics event for the launch funnel.
- **Career, Board, Subject**: Classification entities for filtering and content.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A visitor can reach the first question from landing in under 30
  seconds on a typical mobile connection.
- **SC-002**: 95% of question-answer-comment interactions complete without page
  reload.
- **SC-003**: Trial gating prevents more than 5 free answered questions for
  non-subscribers in automated tests.
- **SC-004**: Subscriber unlock through webhook is completed within 60 seconds
  after payment confirmation in normal provider conditions.
- **SC-005**: Authors can publish a valid question in under 3 minutes after login.
- **SC-006**: Admin can unpublish a question and remove it from feed eligibility
  in under 1 minute.
- **SC-007**: E2E tests cover the critical student, author, admin, and payment
  flows before production launch.
- **SC-008**: The system supports the launch target of 100 users and next-month
  target of 500 users without adding non-MVP infrastructure.

## Assumptions

- Users have internet access while using the web app.
- The first production release uses Supabase Pro and no isolated Supabase staging.
- The first implementation will use text-only questions and comments.
- Abacate Pay provides checkout and webhook capabilities needed for monthly and
  annual plans.
- Official exam questions are allowed with source attribution and editorial
  warnings for annulled or changed items.
- IA features are intentionally out of scope for the MVP.
