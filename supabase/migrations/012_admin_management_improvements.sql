-- Add force_password_change column to user_profiles
ALTER TABLE public.user_profiles
  ADD COLUMN force_password_change boolean NOT NULL DEFAULT false;

-- Enable admin update and delete policies for subjects (disciplinas)
CREATE POLICY "admins can update subjects"
  ON public.subjects FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "admins can delete subjects"
  ON public.subjects FOR DELETE
  USING (is_admin());

-- Enable admin update and delete policies for tags (assuntos)
CREATE POLICY "admins can update tags"
  ON public.tags FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "admins can delete tags"
  ON public.tags FOR DELETE
  USING (is_admin());

-- Enable admin update and delete policies for boards (bancas)
CREATE POLICY "admins can update boards"
  ON public.boards FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "admins can delete boards"
  ON public.boards FOR DELETE
  USING (is_admin());
