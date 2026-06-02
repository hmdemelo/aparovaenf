-- 003_rls_policies.sql
-- Row Level Security policies and auth helper functions.
-- Constitution: Secure Data Boundaries. All sensitive tables are protected;
-- the service role bypasses RLS for server-side webhook/admin operations.

-- =========================================================================
-- Helper functions (SECURITY DEFINER to avoid RLS recursion)
-- =========================================================================

create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from user_profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function is_subscriber()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from subscriptions
    where user_id = auth.uid() and status = 'active'
  );
$$;

-- The author_profiles.id for the current user, or null if not an author.
create or replace function current_author_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select id from author_profiles where user_id = auth.uid();
$$;

-- =========================================================================
-- New-user provisioning: create a user_profiles row on auth signup
-- =========================================================================

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, email, name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'name')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Prevent privilege escalation: an authenticated end user may not change roles.
-- Server-side contexts (service role, seed, admin jobs) have a null auth.uid(),
-- and the anonymous case is already blocked by the user_profiles RLS policy, so
-- this guard targets authenticated non-admin users specifically.
create or replace function prevent_role_escalation()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not is_admin() then
    raise exception 'only admins can change user roles';
  end if;
  return new;
end;
$$;

create trigger trg_prevent_role_escalation
  before update on user_profiles
  for each row execute function prevent_role_escalation();

-- =========================================================================
-- Enable RLS on all domain tables
-- =========================================================================

alter table user_profiles enable row level security;
alter table author_profiles enable row level security;
alter table questions enable row level security;
alter table alternatives enable row level security;
alter table answer_attempts enable row level security;
alter table favorites enable row level security;
alter table subscriptions enable row level security;
alter table payment_events enable row level security;
alter table product_events enable row level security;

-- =========================================================================
-- user_profiles
-- =========================================================================

create policy "users read own profile or admin reads all"
  on user_profiles for select
  using (id = auth.uid() or is_admin());

create policy "users insert own profile"
  on user_profiles for insert
  with check (id = auth.uid());

create policy "users update own profile or admin updates any"
  on user_profiles for update
  using (id = auth.uid() or is_admin())
  with check (id = auth.uid() or is_admin());

-- =========================================================================
-- author_profiles
-- =========================================================================

create policy "public author profiles are readable; owners and admins see all"
  on author_profiles for select
  using (is_public or user_id = auth.uid() or is_admin());

create policy "authors update own profile; admins update any"
  on author_profiles for update
  using (user_id = auth.uid() or is_admin())
  with check (user_id = auth.uid() or is_admin());

create policy "admins manage author profiles"
  on author_profiles for insert
  with check (is_admin());

create policy "admins delete author profiles"
  on author_profiles for delete
  using (is_admin());

-- =========================================================================
-- questions
-- =========================================================================

create policy "published questions are public; authors and admins see own/all"
  on questions for select
  using (
    status = 'published'
    or author_id = current_author_id()
    or is_admin()
  );

create policy "authors create their own questions"
  on questions for insert
  with check (author_id = current_author_id());

create policy "authors edit own questions; admins edit any"
  on questions for update
  using (author_id = current_author_id() or is_admin())
  with check (author_id = current_author_id() or is_admin());

create policy "admins delete questions"
  on questions for delete
  using (is_admin());

-- =========================================================================
-- alternatives (access mirrors the parent question)
-- =========================================================================

create policy "alternatives readable when parent question is visible"
  on alternatives for select
  using (
    exists (
      select 1 from questions q
      where q.id = alternatives.question_id
        and (
          q.status = 'published'
          or q.author_id = current_author_id()
          or is_admin()
        )
    )
  );

create policy "authors manage alternatives of own questions; admins any"
  on alternatives for all
  using (
    exists (
      select 1 from questions q
      where q.id = alternatives.question_id
        and (q.author_id = current_author_id() or is_admin())
    )
  )
  with check (
    exists (
      select 1 from questions q
      where q.id = alternatives.question_id
        and (q.author_id = current_author_id() or is_admin())
    )
  );

-- =========================================================================
-- answer_attempts (authenticated users own their attempts)
-- Anonymous attempts are written server-side via the service role.
-- =========================================================================

create policy "users read own answer attempts; admins read all"
  on answer_attempts for select
  using (user_id = auth.uid() or is_admin());

create policy "users insert own answer attempts"
  on answer_attempts for insert
  with check (user_id = auth.uid());

-- =========================================================================
-- favorites (persist only for active subscribers)
-- =========================================================================

create policy "users read own favorites"
  on favorites for select
  using (user_id = auth.uid());

create policy "subscribers insert own favorites"
  on favorites for insert
  with check (user_id = auth.uid() and is_subscriber());

create policy "users delete own favorites"
  on favorites for delete
  using (user_id = auth.uid());

-- =========================================================================
-- subscriptions (read own; writes are service-role only via webhook)
-- =========================================================================

create policy "users read own subscriptions; admins read all"
  on subscriptions for select
  using (user_id = auth.uid() or is_admin());

-- =========================================================================
-- payment_events: no client access at all (service role bypasses RLS).
-- RLS enabled with no policies => denied for every non-service-role caller.
-- =========================================================================

-- =========================================================================
-- product_events (admins read; writes happen server-side via service role)
-- =========================================================================

create policy "admins read product events"
  on product_events for select
  using (is_admin());
