# Research: User Registration Options (Google OAuth & Magic Link)

## 1. Supabase Auth OAuth & Magic Link Behavior

We researched how Supabase handles Google OAuth and Magic Link flow, specifically within Next.js App Router and the `@supabase/ssr` library.

### Google OAuth Flow
1. **Initiation**: The client calls:
   ```typescript
   supabase.auth.signInWithOAuth({
     provider: 'google',
     options: {
       redirectTo: `${window.location.origin}/api/auth/callback?next=${next}`
     }
   })
   ```
2. **Redirect to Provider**: The browser is redirected to Google.
3. **Provider Callback**: Google redirects back to Supabase, which then redirects the user to our Next.js API route (`/api/auth/callback`) with a `code` parameter.
4. **Session Exchange**: The API route exchanges the `code` for a session using `supabase.auth.exchangeCodeForSession(code)`.

### Magic Link (Passwordless OTP) Flow
1. **Initiation**: The client calls:
   ```typescript
   supabase.auth.signInWithOtp({
     email,
     options: {
       emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${next}`
     }
   })
   ```
2. **Email Delivery**: Supabase sends an email containing a link with a one-time token (`code`).
3. **User Action**: The user clicks the link, bringing them to `/api/auth/callback` with a `code` parameter.
4. **Session Exchange**: The API route exchanges the `code` for a session.

### Profile Creation Trigger Behavior
Since both OAuth and Magic Link registration result in an insert into the `auth.users` table, our existing PostgreSQL trigger `trg_on_auth_user_created` (which runs `handle_new_user()`) will fire automatically. This guarantees that:
- A new row is inserted into `public.user_profiles` with `role = 'student'`.
- The user's name (for Google OAuth, derived from `new.raw_user_meta_data ->> 'name'`) is correctly saved.

---

## 2. Technical Decisions

### Decision 1: Shared Callback Handler
We will create a unified callback route at `/api/auth/callback/route.ts` using the standard Supabase SSR exchange client. This single handler will process both Google OAuth redirects and Magic Link clicks, since both supply a `code` parameter that needs to be exchanged for a session.

* **Rationale**: Eliminates redundant API route code, centralizes error handling for expired/invalid codes, and simplifies cookie persistence.

### Decision 2: UI Integration
We will update the existing `LoginForm` and `SignupForm` to include a prominent "Continuar com o Google" button using a clean Google icon, and add a toggle to sign in/up via passwordless link or password.

* **Rationale**: Maintains a unified entry point, avoids confusing separate forms, and keeps the page clean and mobile-friendly.
