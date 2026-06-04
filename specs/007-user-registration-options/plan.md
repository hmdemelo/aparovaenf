# Implementation Plan: User Registration Options (Google OAuth & Magic Link)

**Branch**: `007-user-registration-options` | **Date**: 2026-06-04 | **Spec**: [spec.md](file:///Users/hugo/projetos/aprovaenf/specs/007-user-registration-options/spec.md)
**Input**: Feature specification from `/specs/007-user-registration-options/spec.md`

## Summary
Add support for passwordless authentication options to the platform:
1. **Google OAuth**: A single-click login/signup option.
2. **Passwordless Magic Links**: An email-only registration and login option. Users submit their email, receive a secure confirmation link, and click it to complete registration and authenticate.

We will create a unified callback route `/api/auth/callback/route.ts` and modify the registration/login views to present these two authentication modes.

---

## Technical Context

- **Language/Version**: TypeScript, Next.js 16+ (App Router)
- **Primary Dependencies**: `@supabase/ssr`, `@supabase/supabase-js`, `lucide-react`
- **Storage**: Supabase Auth, public schema database profiles (`user_profiles`)
- **Testing**: Playwright (E2E)

---

## Constitution Check

- **Mobile-First Learning Value**: The login and signup interfaces must be simple, readable, and highly accessible on narrow screens. Placing Google OAuth at the top offers a fast mobile onboarding path.
- **Secure Data Boundaries**:
  - The API callback route MUST exchange OAuth/OTP code on the server side using the server client.
  - Redirect URIs must be validated on callback.
- **Test-First Delivery**:
  - We will add automated E2E tests simulating Google OAuth and Magic Link authentication redirects.

---

## Project Structure

```text
specs/007-user-registration-options/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── checklists/
    └── requirements.md  # Specification Quality Checklist
```

### Source Code Paths

- **[NEW] [route.ts](file:///Users/hugo/projetos/aprovaenf/app/api/auth/callback/route.ts)**: Unified Next.js API route to exchange auth codes for active sessions.
- **[MODIFY] [login-form.tsx](file:///Users/hugo/projetos/aprovaenf/features/auth/login-form.tsx)**: Add Google login button and support passwordless email link option.
- **[MODIFY] [signup-form.tsx](file:///Users/hugo/projetos/aprovaenf/features/auth/signup-form.tsx)**: Add Google signup button and passwordless email link signup option.

---

## Verification Plan

### Automated Tests
- Implement automated E2E mock callback testing in Playwright to verify that exchange code redirects succeed and create the corresponding user profiles.
- Run `npm run lint` and `npm run typecheck` to ensure no linting/compiler errors are introduced.

### Manual Verification
- Test registration/login using a real Google account in the development environment.
- Test passwordless link emails locally using the Supabase local CLI / email server dashboard or custom configurations.
