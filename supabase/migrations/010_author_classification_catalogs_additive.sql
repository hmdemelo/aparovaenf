-- 010_author_classification_catalogs_additive.sql
-- Add compatibility fields for catalog creation tracking, RLS policies, and backfill unambiguous subject relationships.

create extension if not exists pg_trgm;

-- =========================================================================
-- Add columns and constraints
-- =========================================================================

-- 1. subjects (Disciplina)
alter table public.subjects
  add column created_by_kind text not null default 'system'
    constraint check_subjects_created_by_kind check (created_by_kind in ('system', 'author', 'admin')),
  add column created_by_author_id uuid references public.author_profiles(id) on delete set null;

-- 2. tags (Assunto)
alter table public.tags
  add column created_by_kind text not null default 'system'
    constraint check_tags_created_by_kind check (created_by_kind in ('system', 'author', 'admin')),
  add column created_by_author_id uuid references public.author_profiles(id) on delete set null,
  add column subject_id uuid references public.subjects(id) on delete set null;

-- 3. boards (Banca)
alter table public.boards
  add column created_by_kind text not null default 'system'
    constraint check_boards_created_by_kind check (created_by_kind in ('system', 'author', 'admin')),
  add column created_by_author_id uuid references public.author_profiles(id) on delete set null;

-- =========================================================================
-- Backfill tag subject relationships
-- =========================================================================

update public.tags t
set subject_id = sub.subject_id
from (
  select qt.tag_id, q.subject_id
  from public.question_tags qt
  join public.questions q on q.id = qt.question_id
  where q.subject_id is not null
  group by qt.tag_id, q.subject_id
  having count(distinct q.subject_id) = 1
) sub
where t.id = sub.tag_id and t.subject_id is null;

-- =========================================================================
-- Enable RLS & Write Policies
-- =========================================================================

-- Subjects Policies
drop policy if exists "authors and admins can insert subjects" on public.subjects;
create policy "authors and admins can insert subjects"
  on public.subjects for insert
  with check (
    (
      created_by_kind = 'author' 
      and created_by_author_id = current_author_id() 
      and exists (
        select 1 from public.user_profiles
        where id = auth.uid() and role = 'author'
      )
    )
    or
    (
      created_by_kind = 'admin'
      and created_by_author_id is null
      and is_admin()
    )
  );

-- Tags Policies (Drop old select/insert policies first to write new/updated checks)
drop policy if exists "authors and admins can insert tags" on public.tags;
create policy "authors and admins can insert tags"
  on public.tags for insert
  with check (
    (
      created_by_kind = 'author' 
      and created_by_author_id = current_author_id() 
      and exists (
        select 1 from public.user_profiles
        where id = auth.uid() and role = 'author'
      )
    )
    or
    (
      created_by_kind = 'admin'
      and created_by_author_id is null
      and is_admin()
    )
  );

-- Boards Policies
drop policy if exists "authors and admins can insert boards" on public.boards;
create policy "authors and admins can insert boards"
  on public.boards for insert
  with check (
    (
      created_by_kind = 'author' 
      and created_by_author_id = current_author_id() 
      and exists (
        select 1 from public.user_profiles
        where id = auth.uid() and role = 'author'
      )
    )
    or
    (
      created_by_kind = 'admin'
      and created_by_author_id is null
      and is_admin()
    )
  );

-- =========================================================================
-- Performance and Search Indexes
-- =========================================================================

create index idx_subjects_created_by_author on public.subjects (created_by_author_id);
create index idx_tags_subject_name_id on public.tags (subject_id, name, id);
create index idx_tags_created_by_author on public.tags (created_by_author_id);
create index idx_boards_created_by_author on public.boards (created_by_author_id);

create index idx_subjects_slug_trgm on public.subjects using gin (slug gin_trgm_ops);
create index idx_tags_slug_trgm on public.tags using gin (slug gin_trgm_ops);
create index idx_boards_slug_trgm on public.boards using gin (slug gin_trgm_ops);
