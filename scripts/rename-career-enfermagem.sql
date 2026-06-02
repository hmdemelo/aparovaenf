-- Rename the launch career "Enfermagem" to "Enfermeiro(a)" in production.
--
-- Non-destructive data fix: updates the existing row in place, preserving the
-- career id and all foreign-key references (questions, answer_attempts, etc.).
-- Run once against the production database (e.g. Supabase SQL editor).
-- Idempotent: re-running after the rename matches no rows.

update careers
set name = 'Enfermeiro(a)', slug = 'enfermeiro-a'
where slug = 'enfermagem';
