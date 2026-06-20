-- 018_question_pool.sql
-- Drop the NOT NULL constraint on questions.author_id to support pool drafts.
-- Update RLS policies to allow authors to view, edit, and manage alternatives/tags of pool questions.

-- 1. Alter questions table structure
ALTER TABLE public.questions ALTER COLUMN author_id DROP NOT NULL;

-- 2. Drop existing RLS policies on questions
DROP POLICY IF EXISTS "published questions are public; authors and admins see own/all" ON public.questions;
DROP POLICY IF EXISTS "authors edit own questions; admins edit any" ON public.questions;

-- 3. Create updated RLS policies on questions
CREATE POLICY "published questions public; authors/admins see own/pool"
  ON public.questions FOR SELECT
  USING (
    status = 'published'
    OR author_id = current_author_id()
    OR is_admin()
    OR (author_id IS NULL AND status = 'draft' AND current_author_id() IS NOT NULL)
  );

CREATE POLICY "authors edit own/pool questions; admins edit any"
  ON public.questions FOR UPDATE
  USING (
    author_id = current_author_id()
    OR (author_id IS NULL AND status = 'draft' AND current_author_id() IS NOT NULL)
    OR is_admin()
  )
  WITH CHECK (
    author_id = current_author_id()
    OR author_id IS NULL
    OR is_admin()
  );

-- 4. Drop existing RLS policies on alternatives
DROP POLICY IF EXISTS "alternatives readable when parent question is visible" ON public.alternatives;
DROP POLICY IF EXISTS "authors manage alternatives of own questions; admins any" ON public.alternatives;

-- 5. Create updated RLS policies on alternatives
CREATE POLICY "alternatives readable when parent question is visible"
  ON public.alternatives FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.questions q
      WHERE q.id = alternatives.question_id
        AND (
          q.status = 'published'
          OR q.author_id = current_author_id()
          OR is_admin()
          OR (q.author_id IS NULL AND q.status = 'draft' AND current_author_id() IS NOT NULL)
        )
    )
  );

CREATE POLICY "authors manage alternatives of own/pool questions; admins any"
  ON public.alternatives FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.questions q
      WHERE q.id = alternatives.question_id
        AND (
          q.author_id = current_author_id()
          OR (q.author_id IS NULL AND q.status = 'draft' AND current_author_id() IS NOT NULL)
          OR is_admin()
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.questions q
      WHERE q.id = alternatives.question_id
        AND (
          q.author_id = current_author_id()
          OR (q.author_id IS NULL AND q.status = 'draft' AND current_author_id() IS NOT NULL)
          OR is_admin()
        )
    )
  );

-- 6. Drop existing RLS policies on question_tags
DROP POLICY IF EXISTS "authors can manage question_tags for their own questions" ON public.question_tags;

-- 7. Create updated RLS policies on question_tags
CREATE POLICY "authors can manage question_tags for own/pool questions"
  ON public.question_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.questions q
      WHERE q.id = question_tags.question_id
        AND (
          q.author_id = current_author_id()
          OR (q.author_id IS NULL AND q.status = 'draft' AND current_author_id() IS NOT NULL)
          OR is_admin()
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.questions q
      WHERE q.id = question_tags.question_id
        AND (
          q.author_id = current_author_id()
          OR (q.author_id IS NULL AND q.status = 'draft' AND current_author_id() IS NOT NULL)
          OR is_admin()
        )
    )
  );
