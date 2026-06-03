# Feature Specification: Transition from Abacate Pay to Stripe

**Feature Branch**: `006-stripe-migration`  
**Created**: 2026-06-03  
**Status**: Draft  
**Input**: User description: "Remove Abacate Pay integration and transition to Stripe checkout and subscriptions"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Checkout with Stripe (Priority: P1)

As a registered student ready to subscribe, I want to click the checkout button on the paywall screen and be redirected to a secure Stripe Checkout page to input my payment details, so that I can subscribe safely.

**Why this priority**: Core subscription funnel. Students must be able to start checkout and pay to unlock the feed.

**Independent Test**: Can be fully tested by clicking the checkout button in the paywall and verifying the user lands on the Stripe Checkout page.

**Acceptance Scenarios**:

1. **Given** a student is on the paywall screen, **When** they click "Assinar anual" or "Assinar mensal", **Then** they are redirected to a secure Stripe Checkout session.
2. **Given** a student starts checkout, **When** the checkout page loads, **Then** it shows the correct plan details (Monthly: R$ 29,90 or Annual: R$ 287,00).

---

### User Story 2 - Automated Subscription Activation via Webhook (Priority: P1)

As a subscriber, I want my payment on Stripe Checkout to automatically activate my subscription in the aprovaenf database within seconds of completion, so that I can immediately return to the feed and continue studying.

**Why this priority**: Required for automated, zero-touch user onboarding after payment.

**Independent Test**: Can be tested by sending a simulated Stripe webhook payload and checking if the user's subscription status becomes active in the database.

**Acceptance Scenarios**:

1. **Given** a student has paid their Stripe Checkout session, **When** Stripe fires the `checkout.session.completed` event, **Then** the local database subscription state is updated to `active` and the period dates are set correctly.
2. **Given** a student has an active monthly plan, **When** Stripe fires `invoice.paid` for a recurring month, **Then** the local database subscription period end date is extended by 30 days.
3. **Given** a student cancels their subscription, **When** Stripe fires `customer.subscription.deleted`, **Then** the local database subscription state is updated to `expired` or `cancelled`.

---

## Edge Cases

- **Webhook signature validation**: Webhook endpoints must securely verify Stripe signatures to prevent spoofed activations.
- **Failed or expired checkout session**: When a checkout session expires or fails, the database must not be updated to active.
- **Subscription state synchronization**: When a user cancels the subscription on the Stripe billing portal, the local system must receive `customer.subscription.deleted` and immediately revoke student subscriber access (e.g. favoriting).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST create Stripe Checkout Sessions with the correct `price` corresponding to the chosen plan (Monthly or Annual).
- **FR-002**: System MUST configure checkout sessions with metadata linking the session to the local `user_id` and `subscription_id` to allow database synchronization.
- **FR-003**: System MUST expose a secure webhook endpoint `/api/webhooks/stripe` which validates signatures using the configure `STRIPE_WEBHOOK_SECRET`.
- **FR-004**: System MUST handle Stripe webhook events: `checkout.session.completed`, `invoice.paid`, and `customer.subscription.deleted`.
- **FR-005**: System MUST update the local database `subscriptions` table, setting `provider` to `'stripe'`, and saving the Stripe Customer ID and Subscription ID.
- **FR-006**: In local development, the system MUST fallback to a mock checkout URL if Stripe keys are placeholders, similar to the previous mock setup.

### Key Entities

- **Subscription**: The local database entity that maps a user's subscription state, now referencing Stripe customer/subscription IDs instead of Abacate Pay IDs.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of subscribers are redirected to Stripe Checkout rather than Abacate Pay.
- **SC-002**: Local database is updated to `active` within 5 seconds of the Stripe webhook event.
- **SC-003**: 100% of expired subscriptions on Stripe result in immediate expiration of local access.
- **SC-004**: All unit and E2E tests are updated and pass with 100% success rate.

## Assumptions

- **A-001**: Stripe prices for Monthly (R$ 29,90) and Annual (R$ 287,00) plans are pre-configured in the Stripe Dashboard.
- **A-002**: Stripe PIX payment method is enabled directly in the Stripe account dashboard.
