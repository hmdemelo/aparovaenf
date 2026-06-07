# Technical Research: Admin Management Improvements

This document outlines the design decisions and technical investigation for implementing admin portal updates.

---

## Decision 1: Password Force-Reset Mechanism
We need to let the admin change any user's password and enforce that the user changes this password upon their first login.

### Decision
- Add a new column `force_password_change` (boolean, default false) to the `public.user_profiles` table.
- Create a migration file `012_add_force_password_change.sql` to add this column.
- Create a Next.js Server Action / API route that uses the Supabase Admin API (`auth.admin.updateUser`) via a service-role Supabase client to update the user's password and set `force_password_change = true` on their `user_profiles` record.
- Update layouts (`(student)/layout.tsx`, `(author)/layout.tsx`, and `(admin)/layout.tsx`) to check if the current user has `force_password_change === true`. If so, redirect them to a new page `/force-password`.
- On `/force-password` page, render a form allowing the user to set their new password. On submission, we call the client-side `supabase.auth.updateUser({ password })` and set `force_password_change = false` in `user_profiles`.

### Rationale
- Setting a flag in `user_profiles` is reliable, fast, and does not require complex state management.
- Checking this in layouts guarantees that any page navigation will trigger the redirect, effectively blocking access to any other functionality until the password is changed.
- Updating password via client-side Supabase client uses standard authentication flows and ensures session tokens are properly updated without manual session juggling.

### Alternatives considered
- **Using Supabase metadata**: Storing `force_password_change` in the auth user's `user_metadata` field. However, query filters on auth users are harder to enforce in database-level RLS policies, whereas having it in `user_profiles` makes it accessible to RLS if needed in the future.

---

## Decision 2: Editing/Deleting Classifications (Disciplines, Subjects, Boards)
Allow admins to edit and delete items in the classifications catalogs while safeguarding referential integrity.

### Decision
- **Edit**: Expose simple update inputs in the administrative pages that execute `UPDATE` operations on `subjects`, `tags`, and `boards`.
- **Delete**: Before deleting a classification:
  - Check if any active question references it:
    - For `subjects` (discipline): check if any row in `questions` has `subject_id = <id>` OR if any row in `tags` has `subject_id = <id>`.
    - For `tags` (subject): check if any row in `question_tags` has `tag_id = <id>`.
    - For `boards` (banca): check if any row in `questions` has `board_id = <id>`.
  - If any reference is found, block deletion and return a user-friendly error in Portuguese: "Esta [disciplina/assunto/banca] está em uso por questões ou sub-itens e não pode ser excluída."
  - If no references are found, execute the `DELETE` query.

### Rationale
- Doing validation checks before deletion ensures that we don't end up with broken references, orphans, or unexpected cascading behavior, providing a safe administrative experience.

### Alternatives considered
- **Allowing cascades**: Allowing the database to cascade-delete associations. This was rejected because deleting a discipline or subject should never implicitly delete or alter associated questions without the administrator explicitly re-classifying them first.

---

## Decision 3: Moderation Table Pagination, Sorting, and Filters
Improve performance and usability of the admin questions moderation page.

### Decision
- **Pagination**: The moderation list query will apply a default `LIMIT 30` and sort by `created_at DESC` (newest first).
- **Sorting**: Allow clicking headers. The page will maintain `sortField` and `sortOrder` in state (or query parameters) and reload. Clicking toggles ascending/descending/none.
- **Filters**: Filter fields and the search input will be managed as local component state. Changing them will not trigger automatic API queries. A dedicated "Buscar" button will be rendered; clicking it will trigger the search with all currently selected filters.

### Rationale
- Prevents database overloads on keyup events and keeps the table loading times instant.
