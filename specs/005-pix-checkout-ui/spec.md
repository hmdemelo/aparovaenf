# Feature Specification: Pix support indicators in pricing and checkout UI

**Feature Branch**: `005-pix-checkout-ui`  
**Created**: 2026-06-03  
**Status**: Draft  
**Input**: User description: "Pix support indicators in pricing and checkout UI (Option A)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Clear pricing details on landing page (Priority: P1)

As a prospective student exploring aprovaenf, I want to clearly see which payment methods are accepted for each plan (Monthly vs Annual) on the landing page, so that I can choose a plan that matches my preferred payment method.

**Why this priority**: Crucial for transparency and establishing user trust at the first touchpoint, reducing purchase friction.

**Independent Test**: Can be fully tested by visiting the landing page pricing section and verifying the visual indicators.

**Acceptance Scenarios**:

1. **Given** a visitor is on the landing page, **When** they view the Monthly plan card, **Then** they see that only Credit Card is accepted.
2. **Given** a visitor is on the landing page, **When** they view the Annual plan card, **Then** they see that both PIX and Credit Card (up to 12 installments) are accepted.

---

### User Story 2 - Informed choice on paywall screen (Priority: P1)

As a registered student who has exhausted their trial questions, I want to see clear payment method indicators on the paywall screen before I start checkout, so that I know I can pay with PIX for the Annual plan.

**Why this priority**: Crucial for conversion, as students who hit the paywall need to know they have PIX as an option without needing to start the checkout process to find out.

**Independent Test**: Can be fully tested by answering questions until hitting the paywall, verifying the plan details.

**Acceptance Scenarios**:

1. **Given** a student is on the paywall page, **When** they view the Monthly plan card, **Then** they see a clear indicator showing that Credit Card is the only method.
2. **Given** a student is on the paywall page, **When** they view the Annual plan card, **Then** they see a clear badge/indicator showing "PIX ou Cartão" and that up to 12 installments are supported.
3. **Given** a student clicks the checkout button on either plan, **When** the checkout starts, **Then** they are sent to the payment provider with the correct payment method restrictions.

---

### Edge Cases

- **Installments disclaimer**: The annual plan supports installments on credit card (up to 12x), which must be clearly communicated so the user understands PIX is for single-installment payments.
- **Provider checkout alignment**: The payment options presented in the UI must exactly align with what the payment provider checkout page allows.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Monthly plan card in the public pricing section and inside the paywall MUST explicitly indicate it is billed exclusively via Credit Card.
- **FR-002**: The Annual plan card in the public pricing section and inside the paywall MUST explicitly and visually emphasize that it accepts both PIX and Credit Card.
- **FR-003**: The Annual plan pricing description MUST inform the user that credit card payments can be split in up to 12 installments.
- **FR-004**: The checkout button for the Annual plan in the paywall MUST feature visual icons representing both PIX and Credit Cards.
- **FR-005**: The checkout button for the Monthly plan in the paywall MUST feature visual icons representing Credit Card only.

### Key Entities *(include if feature involves data)*

- **Plan**: Represents the subscription offerings (Monthly and Annual), including price, billing cycle, and allowed payment methods.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of visitors looking at the pricing page can identify that the Annual plan accepts PIX without needing to click the checkout button.
- **SC-002**: Zero users are redirected to the billing provider for the Monthly plan expecting a PIX option.
- **SC-003**: All E2E subscription flow and paywall tests pass without regression.

## Assumptions

- **A-001**: The annual plan uses Abacate Pay checkout which natively provides PIX and Credit Card options when both methods are enabled in the payload.
- **A-002**: The monthly plan uses Abacate Pay subscriptions which only support Credit Card due to automatic recurrence.
- **A-003**: No backend logic changes are required to enable PIX on the annual checkout payload since `methods: ['PIX', 'CARD']` is already set.
