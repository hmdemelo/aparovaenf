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

### User Story 2 - Passwordless Registration & Login via Email Link (Priority: P1)

As a user (student), I want to type my email address on the login/signup page and receive a secure link in my inbox, so that clicking that link logs me in and completes my registration without requiring a password.

**Why this priority**: Passwordless, secure email fallback that doesn't require Google accounts.

**Independent Test**:
1. User enters their email and clicks "Enviar link de acesso".
2. System displays a check-email notice.
3. User clicks the link in their email inbox.
4. User is redirected to the platform, authenticated, and redirected to the feed.

**Acceptance Scenarios**:
1. **Given** a new user enters their email and clicks "Enviar link de acesso", **When** they click the link in their email, **Then** a new account is created, they are logged in, and redirected to the feed.
2. **Given** an existing user enters their email and clicks "Enviar link de acesso", **When** they click the link in their email, **Then** they are logged in and redirected to their existing profile/feed.

---

### User Story 3 - Unified and Premium Authentication UI (Priority: P2)

As a user, I want a clean, simple, and unified login and signup interface that presents the Google option and the Email Link option clearly, so that I understand my options instantly.

**Why this priority**: Premium UX/UI layout.

**Independent Test**:
A user opens `/login` or `/signup` and sees a cohesive, beautiful screen containing the "Continue with Google" button and the email passwordless input form.

**Acceptance Scenarios**:
1. **Given** a user navigates to `/login` or `/signup`, **When** the page renders, **Then** they see the Google login button and the email input form clearly separated.
2. **Given** the user inputs an invalid email format, **When** they submit, **Then** a clear error message is shown before sending.

---

### Edge Cases

- **Expired or Invalid Link Clicked**: If a user clicks an expired, modified, or already-used magic link, they should see a dedicated, friendly error page with an option to request a new link.
- **Email Rate Limits**: If a user requests a magic link multiple times in a short interval, they should see a helpful notice asking them to wait a few minutes.
- **Email Delivery Failure**: If the link email cannot be sent, a clear notification is shown so the user can verify their email address or try again.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST support single-click registration and login using Google OAuth2.
- **FR-002**: The system MUST support passwordless registration and login via a secure email confirmation link (Magic Link).
- **FR-003**: The email link MUST expire after a standard duration (e.g. 24 hours or less) to ensure security.
- **FR-004**: The system MUST provision a default `student` profile in the database upon the first successful registration via either Google or Email Link.
- **FR-005**: The system MUST redirect authenticated users to the correct post-login destination (e.g., `/feed` or the originally requested page).
- **FR-006**: The login and signup pages MUST present both authentication options (Google and Email Link) in a unified, responsive design.

### Key Entities

- **User Profile**: Represents a registered user. Attributes: `id` (UUID), `email` (Text), `name` (Text), `role` (enum: student, author, admin), `created_at` (Timestamp).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can request a passwordless link or start Google authentication in under 2 clicks.
- **SC-002**: The login/signup page loads and is interactive in under 300ms.
- **SC-003**: The redirection and session exchange from the Google OAuth callback or Magic Link callback takes under 500ms.

## Assumptions

- Google credentials (Client ID, Client Secret) and Supabase configurations will be updated in the Supabase console by the user.
- The default email confirmation settings in Supabase will be configured by the user to support Magic Links.
