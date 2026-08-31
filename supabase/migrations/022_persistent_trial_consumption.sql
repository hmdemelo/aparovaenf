-- 022_persistent_trial_consumption.sql
-- Make trial consumption survive account deletion.
--
-- Problem: the trial counter reads answer_attempts by user_id, and both the
-- attempts and the profile cascade away when the auth user is deleted. Anyone
-- could delete and recreate their account to get the 3 free questions again,
-- indefinitely.
--
-- Fix: record consumption against a normalized e-mail in a table that has NO
-- foreign key to auth.users / user_profiles, so nothing cascades into it. The
-- counter then reads max(attempts by user_id, consumption by e-mail), which
-- keeps the count correct for a normal account and floors it at whatever the
-- e-mail already spent before any deletion.

CREATE TABLE IF NOT EXISTS public.trial_consumption (
  email text PRIMARY KEY,
  answered_count integer NOT NULL DEFAULT 0,
  first_answered_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.trial_consumption IS
  'Trial questions already spent by an e-mail address. Deliberately has no FK to '
  'auth.users so it survives account deletion and blocks trial farming via '
  'delete-and-recreate.';

COMMENT ON COLUMN public.trial_consumption.email IS
  'Lowercased, trimmed e-mail. Normalization happens in record_trial_consumption.';

CREATE TRIGGER trg_trial_consumption_updated_at
  BEFORE UPDATE ON public.trial_consumption
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS: this table is written and read only through the service-role client on
-- the server (trial gating is never client-trusted). No policy is granted to
-- anon/authenticated, so end users cannot read or forge their own consumption.
ALTER TABLE public.trial_consumption ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.trial_consumption FROM anon, authenticated;
GRANT ALL ON public.trial_consumption TO service_role;

-- =========================================================================
-- Recording helper
-- =========================================================================
-- Called once per answered question by a non-subscriber. Monotonic: the stored
-- count only ever moves up, so a recreated account cannot lower it by
-- re-answering from zero.
CREATE OR REPLACE FUNCTION public.record_trial_consumption(
  p_email text,
  p_answered_count integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_count integer;
BEGIN
  v_email := lower(btrim(p_email));
  IF v_email = '' OR v_email IS NULL THEN
    RETURN 0;
  END IF;

  INSERT INTO public.trial_consumption (email, answered_count)
  VALUES (v_email, greatest(p_answered_count, 0))
  ON CONFLICT (email) DO UPDATE
    SET answered_count = greatest(
      public.trial_consumption.answered_count,
      excluded.answered_count
    )
  RETURNING answered_count INTO v_count;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.record_trial_consumption(text, integer) FROM public;
GRANT EXECUTE ON FUNCTION public.record_trial_consumption(text, integer) TO service_role;

-- =========================================================================
-- Backfill
-- =========================================================================
-- Seed the table from the attempts that already exist, so users who spent their
-- trial before this migration keep that state if they delete and recreate.
INSERT INTO public.trial_consumption (email, answered_count, first_answered_at)
SELECT
  lower(btrim(u.email)),
  count(a.id),
  min(a.answered_at)
FROM public.user_profiles u
JOIN public.answer_attempts a ON a.user_id = u.id
WHERE u.email IS NOT NULL AND btrim(u.email) <> ''
GROUP BY lower(btrim(u.email))
ON CONFLICT (email) DO UPDATE
  SET answered_count = greatest(
    public.trial_consumption.answered_count,
    excluded.answered_count
  );
