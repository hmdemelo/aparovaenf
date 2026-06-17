-- Add image_path to questions and configure storage bucket policies.
-- 017_question_images.sql

-- 1. Alter questions table to add nullable image_path
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS image_path text;

-- 2. Create the storage bucket 'question-images' if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('question-images', 'question-images', true)
ON CONFLICT (id) DO NOTHING;

-- 3. RLS Storage policies
-- Clean up existing ones for idempotency
DROP POLICY IF EXISTS "Allow public select on question-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow author/admin insert on question-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow author/admin update on question-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow author/admin delete on question-images" ON storage.objects;

-- Allow public read of items in 'question-images' bucket
CREATE POLICY "Allow public select on question-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'question-images');

-- Allow authenticated authors and admins to upload images
CREATE POLICY "Allow author/admin insert on question-images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'question-images'
    AND (
      public.is_admin()
      OR public.current_author_id() IS NOT NULL
    )
  );

-- Allow authenticated authors and admins to update images
CREATE POLICY "Allow author/admin update on question-images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'question-images'
    AND (
      public.is_admin()
      OR public.current_author_id() IS NOT NULL
    )
  );

-- Allow authenticated authors and admins to delete images
CREATE POLICY "Allow author/admin delete on question-images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'question-images'
    AND (
      public.is_admin()
      OR public.current_author_id() IS NOT NULL
    )
  );
