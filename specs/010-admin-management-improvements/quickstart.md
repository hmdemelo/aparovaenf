# Quickstart Guide: Admin Management Improvements

This guide outlines how to configure, run, and verify the admin management improvements locally.

---

## 1. Apply Database Migration

Create a new migration file: `supabase/migrations/012_admin_management_improvements.sql` with the following content:

```sql
-- Add force_password_change flag to user_profiles
ALTER TABLE public.user_profiles 
  ADD COLUMN force_password_change boolean NOT NULL DEFAULT false;

-- Enable admin update and delete policies
DROP POLICY IF EXISTS "admins can update any user profile" ON public.user_profiles;
CREATE POLICY "admins can update any user profile"
  ON public.user_profiles FOR ALL
  USING (
    (select role from public.user_profiles where id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (select role from public.user_profiles where id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "admins can manage subjects" ON public.subjects;
CREATE POLICY "admins can manage subjects"
  ON public.subjects FOR ALL
  USING (
    (select role from public.user_profiles where id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (select role from public.user_profiles where id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "admins can manage tags" ON public.tags;
CREATE POLICY "admins can manage tags"
  ON public.tags FOR ALL
  USING (
    (select role from public.user_profiles where id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (select role from public.user_profiles where id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "admins can manage boards" ON public.boards;
CREATE POLICY "admins can manage boards"
  ON public.boards FOR ALL
  USING (
    (select role from public.user_profiles where id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (select role from public.user_profiles where id = auth.uid()) = 'admin'
  );
```

Then apply the migration to your local/development Supabase database.

---

## 2. Verification Commands

### Automated Tests
Run unit and integration tests:
```bash
npm run test
npm run test:integration
```

Run end-to-end tests:
```bash
npm run test:e2e
```

### Manual Verification
1. Log in as an administrator at `/login` (using credentials `admin@aprovaenf.local` / `aprovaenf123`).
2. Navigate to `/admin/users` and click the "Alterar Senha" button for any student user.
3. Enter a new password (e.g. `novasenha123`) and submit.
4. Open an incognito browser window or log out.
5. Log in as the modified user using the new password.
6. Verify that you are immediately redirected to `/force-password` and cannot browse elsewhere.
7. Fill in a new password, submit, and verify that you are redirected to the student study feed.
