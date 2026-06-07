-- Prevent users from bypassing an administrator-required password change by
-- clearing their own profile flag directly through the public client. An admin
-- may still flag another account; service-role contexts clear the flag only
-- after the password is changed successfully.
create or replace function prevent_protected_profile_changes()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is not null
     and auth.uid() = old.id
     and new.force_password_change is distinct from old.force_password_change then
    raise exception 'force_password_change must be changed by the secure server flow';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_protected_profile_changes
  on public.user_profiles;

create trigger trg_prevent_protected_profile_changes
  before update on public.user_profiles
  for each row execute function prevent_protected_profile_changes();
