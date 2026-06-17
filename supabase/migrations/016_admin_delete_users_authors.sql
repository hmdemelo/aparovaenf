-- Admin deletion of users and authors.
-- 016_admin_delete_users_authors.sql
--
-- Adds the missing DELETE policy on user_profiles and a transactional RPC that
-- removes an author together with their questions (and the answer attempts /
-- favorites / alternatives that hang off those questions) in a single atomic
-- statement. The auth user is deleted separately by the server via the Auth
-- Admin API, which cascades user_profiles -> author_profiles on its own.

-- =========================================================================
-- 1. Allow admins to delete user_profiles
-- =========================================================================
-- author_profiles and questions already have admin DELETE policies (003).
-- user_profiles only had SELECT/INSERT/UPDATE, so admin deletion was blocked.
CREATE POLICY "admins delete users"
  ON public.user_profiles FOR DELETE
  USING (public.is_admin());

-- =========================================================================
-- 2. Transactional author + questions deletion
-- =========================================================================
-- SECURITY DEFINER so the whole chain runs as one transaction with the
-- privileges needed to clear answer_attempts (which carry an ON DELETE RESTRICT
-- foreign key to alternatives). When invoked through a user-scoped client we
-- still require is_admin(); the service-role client (auth.uid() is null) is
-- already gated by the admin API route before it ever calls this function.
--
-- p_delete_questions = false  -> fails if the author still owns any question,
--                                forcing the caller to reassign first.
-- p_delete_questions = true   -> wipes the author's questions and everything
--                                that depends on them, then the author profile.
CREATE OR REPLACE FUNCTION public.delete_author_cascade(
  p_author_id uuid,
  p_delete_questions boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_question_count integer;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'only admins may delete authors'
      USING ERRCODE = '42501';
  END IF;

  SELECT count(*) INTO v_question_count
  FROM public.questions
  WHERE author_id = p_author_id;

  IF v_question_count > 0 AND NOT p_delete_questions THEN
    RAISE EXCEPTION 'author still owns % question(s)', v_question_count
      USING ERRCODE = '23503';
  END IF;

  IF p_delete_questions AND v_question_count > 0 THEN
    -- answer_attempts.selected_alternative_id is ON DELETE RESTRICT, so the
    -- attempts must go before the alternatives they point at. Deleting them by
    -- question_id covers every attempt tied to this author's questions.
    DELETE FROM public.answer_attempts
    WHERE question_id IN (
      SELECT id FROM public.questions WHERE author_id = p_author_id
    );

    DELETE FROM public.favorites
    WHERE question_id IN (
      SELECT id FROM public.questions WHERE author_id = p_author_id
    );

    -- alternatives cascade from questions, but delete explicitly so the order
    -- is unambiguous and the RESTRICT above is already satisfied.
    DELETE FROM public.alternatives
    WHERE question_id IN (
      SELECT id FROM public.questions WHERE author_id = p_author_id
    );

    DELETE FROM public.questions
    WHERE author_id = p_author_id;
  END IF;

  DELETE FROM public.author_profiles
  WHERE id = p_author_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_author_cascade(uuid, boolean) FROM public;
GRANT EXECUTE ON FUNCTION public.delete_author_cascade(uuid, boolean) TO authenticated, service_role;
