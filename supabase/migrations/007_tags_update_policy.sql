-- 007_tags_update_policy.sql
-- Ensure the tags update policy exists so authors/admins can upsert tags.
-- Migration 006 already creates this policy; drop-then-create keeps the chain
-- idempotent and order-safe (re-running or applying both in sequence won't fail).

drop policy if exists "authors and admins can update tags" on public.tags;

create policy "authors and admins can update tags"
  on public.tags for update
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role in ('author', 'admin')
    )
  );
