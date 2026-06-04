# Feature Specification: User Registration Options (Google OAuth & Passwordless Email Link)

**Feature Branch**: `007-user-registration-options`  
**Created**: 2026-06-04  
**Status**: Draft  
**Input**: User description: "nesse primeiro momento vamos usar o seguinte sistema de cadastro. dois modos. Um, colocando o e-mail e recebendo um e-mail para confirmar e concluir o cadastro. Ou usando a conta google para fazer o cadastro ou logar nas telas de login."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Authentication via Google Account (Priority: P1)

As a user (student), I want to register or log in instantly by clicking a "Continue with Google" button, so that I can access the platform without creating a password.

**Why this priority**: High-conversion, friction-free login path.

**Independent Test**:
1. User clicks "Continuar com o Google" on the login or signup page.
2. User authenticates on Google's login screen.
3. User is redirected back to the platform and immediately logged in. A new user profile is created automatically if they didn't exist.

**Acceptance Scenarios**:
1. **Given** a new user is on the login/signup page, **When** they click "Continuar com o Google" and authenticate, **Then** their account is created, they are redirected to the feed, and a student profile is provisioned.
2. **Given** an existing user is on the login page, **When** they click "Continuar com o Google" and authenticate, **Then** they are logged into their existing profile and redirected to the feed.

---

### User Story 2 - Passwordless Registration & Post-Callback Password Setup (Priority: P1)

As a user (student), I want to type my name and email address on the signup page (without entering a password) and receive a secure confirmation link in my inbox, so that clicking that link brings me back to the platform where I can set my password and complete my registration.

**Why this priority**: Lower friction on initial sign-up, ensuring email is validated before forcing password creation.

**Independent Test**:
1. User enters name and email on `/signup` (no password field visible) and clicks "Enviar link de acesso".
2. System displays a check-email notice.
3. User clicks the link in their email inbox.
4. User is redirected to `/completar-cadastro` where they must set a password.
5. After entering a password, they are fully registered and redirected to `/feed`.

**Acceptance Scenarios**:
1. **Given** a new user signs up without a password, **When** they click the email confirmation link, **Then** they are redirected to the `/completar-cadastro` page and cannot access protected pages until a password is set.
2. **Given** a user sets their password on `/completar-cadastro`, **When** they submit the password, **Then** their profile status updates, and they are redirected to the feed.

---

### User Story 3 - Unified and Premium Authentication UI (Priority: P2)

As a user, I want a clean, simple, and unified login and signup interface that presents the Google option and the Email Link option clearly, so that I understand my options instantly.

**Why this priority**: Premium UX/UI layout.

**Independent Test**:
A user opens `/login` or `/signup` and sees a cohesive, beautiful screen containing the "Continue with Google" button and the email passwordless input form.

**Acceptance Scenarios**:
1. **Given** a user navigates to `/signup`, **When** the page renders, **Then** they see the Google login button and the name/email input fields (without any password fields).
2. **Given** a user navigates to `/login`, **When** the page renders, **Then** they see the option to log in with Google, log in via Magic Link, or use the password login fallback.

---

### User Story 4 - User Status Identification (Priority: P2)

As a user and an administrator, I want to clearly see the registration and subscription status of users in the platform, so that I can verify their access level.

**Why this priority**: Critical business logic for tracing user funnel conversion.

**Independent Test**:
1. An admin logs in and views the user management page.
2. They see the exact status label ("cadastro não concluído", "cadastro free", or "assinatura ativa") for each user.

**Acceptance Scenarios**:
1. **Given** a user who has clicked their email link but has NOT set their password yet, **When** they are queried, **Then** their status is "cadastro não concluído".
2. **Given** a user who has set their password but has no active subscription, **When** they are queried, **Then** their status is "cadastro free".
3. **Given** a user who has set their password and has paid, **When** they are queried, **Then** their status is "assinatura ativa".

---

### Edge Cases

- **Accessing Protected Routes with Incomplete Registration**: If a user is logged in but has not completed their registration (i.e. has no password set), attempting to access protected routes like `/feed`, `/favorites`, `/errors` MUST redirect them to `/completar-cadastro`.
- **Expired or Invalid Link Clicked**: If a user clicks an expired, modified, or already-used magic link, they should see a dedicated, friendly error page with an option to request a new link.
- **Email Rate Limits**: If a user requests a magic link multiple times in a short interval, they should see a helpful notice asking them to wait a few minutes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST support single-click registration and login using Google OAuth2.
- **FR-002**: The system MUST support passwordless registration and login via a secure email confirmation link (Magic Link).
- **FR-003**: The email link MUST expire after a standard duration (e.g. 24 hours or less) to ensure security.
- **FR-004**: The system MUST provision a default `student` profile in the database upon the first successful registration via either Google or Email Link.
- **FR-005**: The system MUST redirect authenticated users to the correct post-login destination (e.g., `/feed` or the originally requested page).
- **FR-006**: The signup page MUST NOT request a password. It must only request Name and E-mail.
- **FR-007**: Upon returning from the email verification link, users who have not completed their password registration MUST be forced to set a password on `/completar-cadastro` before accessing protected pages.
- **FR-008**: Google OAuth registration MUST bypass the password creation step and complete registration automatically.
- **FR-009**: The system MUST track and identify three user registration/subscription statuses:
  - **cadastro não concluído**: Profile exists but password has not been created.
  - **cadastro free**: Password is created, but no active subscription.
  - **assinatura ativa**: Password is created, and subscription is active.
- **FR-010**: The Admin User Management page MUST display these exact status labels for all registered users.

### Key Entities

- **User Profile**: Represents a registered user. Attributes: `id` (UUID), `email` (Text), `name` (Text), `role` (enum: student, author, admin), `registration_completed` (Boolean), `created_at` (Timestamp).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can request a passwordless link or start Google authentication in under 2 clicks.
- **SC-002**: The login/signup page loads and is interactive in under 300ms.
- **SC-003**: The redirection and session exchange from the Google OAuth callback or Magic Link callback takes under 500ms.
- **SC-004**: Users whose registration is not completed are blocked from accessing feed questions 100% of the time.

## Assumptions

- Google credentials (Client ID, Client Secret) and Supabase configurations will be updated in the Supabase console by the user.
- The default email confirmation settings in Supabase will be configured by the user to support Magic Links.

