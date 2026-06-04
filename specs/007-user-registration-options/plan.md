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
- **Testing**: Playwright (E2E), Vitest (integration)

---

## Constitution Check

- **Mobile-First Learning Value**: The login, signup, and password-completion interfaces must be extremely simple and optimized for mobile screens.
- **Secure Data Boundaries**:
  - The API callback route MUST exchange OAuth/OTP code on the server side.
  - Users with `registration_completed = false` MUST be redirected away from learning pages and feed questions.
- **Test-First Delivery**:
  - Implement E2E and integration tests verifying registration completion routing.

---

## Technical Design & Strategy

### 1. Database & TypeScript Schema Update
* We will create a migration `008_add_registration_completed_column.sql` to add `registration_completed` (boolean, default false) to `public.user_profiles`.
* Update `lib/db/database.types.ts` to include `registration_completed`.
* Update the `getCurrentUser()` helper in `lib/auth/roles.ts` to retrieve and return `registrationCompleted: boolean`.

### 2. Password Creation Flow
* **Sign-up Page**: Remove password input and the password sign-up submit button from `SignupForm` (`features/auth/signup-form.tsx`).
* **Auth Callback Route**: Modify `app/api/auth/callback/route.ts`:
  - When returning from Google OAuth, automatically set `registration_completed = true` in their `user_profiles` row.
  - When returning from Magic Link, if the user has `registration_completed === false`, redirect them to `/completar-cadastro?next=${encodeURIComponent(next)}`.
* **Password Completion Page**: Create a new page `app/(public)/completar-cadastro/page.tsx` rendering a form that:
  - Takes a new password and calls `supabase.auth.updateUser({ password })`.
  - Upon success, updates `registration_completed: true` in `public.user_profiles`.
  - Redirects to `next` (e.g., `/feed`).

### 3. State/Status Identification
We will map user attributes to three states:
1. **Cadastro não concluído**: `registration_completed` is `false`.
2. **Cadastro free**: `registration_completed` is `true` and the user has NO active subscription.
3. **Assinatura ativa**: `registration_completed` is `true` and the user HAS an active subscription.

These states will be resolved:
* In student page routes (`/feed`, `/favorites`, `/errors`, `/history`, `/assinar`) to redirect users with `registration_completed === false` to `/completar-cadastro`.
* In `features/admin/admin-service.ts` and `app/(admin)/admin/users/page.tsx` to display the exact status text for each user.

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

- **[NEW] [008_add_registration_completed_column.sql](file:///Users/hugo/projetos/aprovaenf/supabase/migrations/008_add_registration_completed_column.sql)**: Database migration adding the column and updating existing seed data.
- **[NEW] [page.tsx](file:///Users/hugo/projetos/aprovaenf/app/(public)/completar-cadastro/page.tsx)**: Page wrapper for completing password registration.
- **[NEW] [complete-registration-form.tsx](file:///Users/hugo/projetos/aprovaenf/features/auth/complete-registration-form.tsx)**: Client component rendering the password completion form.
- **[MODIFY] [roles.ts](file:///Users/hugo/projetos/aprovaenf/lib/auth/roles.ts)**: Update `getCurrentUser()` to return `registrationCompleted`.
- **[MODIFY] [route.ts](file:///Users/hugo/projetos/aprovaenf/app/api/auth/callback/route.ts)**: Redirect incomplete registrations and auto-complete Google OAuth users.
- **[MODIFY] [signup-form.tsx](file:///Users/hugo/projetos/aprovaenf/features/auth/signup-form.tsx)**: Remove password inputs.
- **[MODIFY] [admin-service.ts](file:///Users/hugo/projetos/aprovaenf/features/admin/admin-service.ts)**: Fetch `registration_completed` and calculate user status.
- **[MODIFY] [page.tsx](file:///Users/hugo/projetos/aprovaenf/app/(admin)/admin/users/page.tsx)**: Show exact status labels.
- **[MODIFY] [feed/page.tsx](file:///Users/hugo/projetos/aprovaenf/app/(student)/feed/page.tsx)** (and other student routes): Redirect to `/completar-cadastro` if incomplete.


---

## Verification Plan

### Automated Tests
- Implement automated E2E mock callback testing in Playwright to verify that exchange code redirects succeed and create the corresponding user profiles.
- Run `npm run lint` and `npm run typecheck` to ensure no linting/compiler errors are introduced.

### Manual Verification
- Test registration/login using a real Google account in the development environment.
- Test passwordless link emails locally using the Supabase local CLI / email server dashboard or custom configurations.
