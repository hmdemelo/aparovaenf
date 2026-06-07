# Data Model: Admin Management Improvements

This document describes the database schema additions and policies required for the admin management improvements feature.

---

## Schema Changes

### 1. `user_profiles` Table
Add a column to indicate if a password change is required on next login.

```sql
ALTER TABLE public.user_profiles
  ADD COLUMN force_password_change boolean NOT NULL DEFAULT false;
```

---

## Row Level Security (RLS) Policies

### 1. `user_profiles` Updates
Only administrators are allowed to toggle or modify `force_password_change` for other users (or update password details via server-side service clients).

```sql
-- Admin can write user profiles (including force_password_change)
create policy "admins can update any user profile"
  on public.user_profiles for update
  using (is_admin())
  with check (is_admin());
```

### 2. Classification Catalogs (Write Policies)
Administrators must be allowed to update and delete records in `subjects`, `tags`, and `boards`.

```sql
-- subjects (Disciplinas)
create policy "admins can update and delete subjects"
  on public.subjects for all
  using (is_admin())
  with check (is_admin());

-- tags (Assuntos)
create policy "admins can update and delete tags"
  on public.tags for all
  using (is_admin())
  with check (is_admin());

-- boards (Bancas)
create policy "admins can update and delete boards"
  on public.boards for all
  using (is_admin())
  with check (is_admin());
```

---

## Data Validation Rules

1. **Password Change Enforcement**:
   - `force_password_change` is set to `true` when an admin resets a user's password.
   - Set to `false` only when the user completes the password change form successfully.
2. **Classification Deletion Guard**:
   - Deleting a subject (`subjects` table) is rejected if `count(questions.id where subject_id = subject.id) > 0` or `count(tags.id where subject_id = subject.id) > 0`.
   - Deleting a tag (`tags` table) is rejected if `count(question_tags.question_id where tag_id = tag.id) > 0`.
   - Deleting a board (`boards` table) is rejected if `count(questions.id where board_id = board.id) > 0`.
