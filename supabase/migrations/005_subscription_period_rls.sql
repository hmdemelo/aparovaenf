-- 004_subscription_period_rls.sql
-- Align the database subscriber helper with the server-side access rule.
-- An active row only grants subscriber privileges while the provider period is
-- still current. Null period end is allowed for provider events that have not
-- supplied period metadata yet.

create or replace function is_subscriber()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from subscriptions
    where user_id = auth.uid()
      and status = 'active'
      and (current_period_end is null or current_period_end > now())
  );
$$;
