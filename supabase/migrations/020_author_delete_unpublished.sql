-- 020_author_delete_unpublished.sql
-- Allow authors to delete their OWN questions that are not yet published.
--
-- Until now only admins had a DELETE policy on questions (003). Authors could
-- create and edit drafts but never remove them. This adds a narrow DELETE policy
-- so an author can clean up a question they own while it is still a draft,
-- unpublished, or archived — never a published one (those stay admin-only via
-- the existing "admins delete questions" policy).
--
-- The FK answer_attempts.selected_alternative_id is ON DELETE RESTRICT, so the
-- database already blocks deleting any question that students have answered.
-- The service layer also checks this first to return a clean error message.

CREATE POLICY "authors delete own unpublished questions"
  ON public.questions FOR DELETE
  USING (
    author_id = current_author_id()
    AND status <> 'published'
  );
