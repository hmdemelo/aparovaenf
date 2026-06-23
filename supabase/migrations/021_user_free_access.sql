-- Admin-granted free access: lets a student use the platform as if subscribed,
-- without any payment. Intended for platform testing and comped accounts.
--
-- The server treats free_access as an active subscription inside isSubscriber(),
-- so every access gate (feed, favorites, trial, post-login) inherits it.

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS free_access boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.user_profiles.free_access IS
  'Admin override: grants full platform access without payment. Used for testing/comped accounts.';

-- Favorites and error-history RLS gate writes behind is_subscriber(). Extend the
-- helper so admin-granted free access also unlocks them, matching the server-side
-- isSubscriber() short-circuit.
create or replace function is_subscriber()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    exists (
      select 1 from user_profiles
      where id = auth.uid()
        and free_access = true
    )
    or exists (
      select 1 from subscriptions
      where user_id = auth.uid()
        and status = 'active'
        and (current_period_end is null or current_period_end > now())
    );
$$;
