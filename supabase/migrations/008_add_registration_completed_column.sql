-- 008_add_registration_completed_column.sql
-- Add registration_completed column to user_profiles and update existing admin/author/seed users.

ALTER TABLE public.user_profiles
ADD COLUMN registration_completed boolean NOT NULL DEFAULT false;

-- Update existing admins and authors to have registration completed
UPDATE public.user_profiles
SET registration_completed = true
WHERE role IN ('admin', 'author');

-- Also, update existing seed/test user accounts
UPDATE public.user_profiles
SET registration_completed = true
WHERE email IN (
  'admin@aprovaenf.com.br',
  'teste@aprovaenf.com.br',
  'admin@aprovaenf.local',
  'aluno@aprovaenf.local',
  'assinante@aprovaenf.local'
);
