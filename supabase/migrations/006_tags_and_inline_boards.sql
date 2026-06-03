-- 006_tags_and_inline_boards.sql
-- Migration to support dynamic question tags (sub-subjects) and inline board registration by authors.

-- =========================================================================
-- Boards Table: Add insert policy for authors and admins
-- =========================================================================

create policy "authors and admins can insert boards"
  on boards for insert
  with check (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role in ('author', 'admin')
    )
  );

-- =========================================================================
-- Tags Table
-- =========================================================================

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

-- Enable RLS on tags
alter table public.tags enable row level security;

-- Policies for tags
create policy "tags are readable by everyone"
  on public.tags for select
  using (true);

create policy "authors and admins can insert tags"
  on public.tags for insert
  with check (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role in ('author', 'admin')
    )
  );

create policy "authors and admins can update tags"
  on public.tags for update
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role in ('author', 'admin')
    )
  );

-- =========================================================================
-- Question Tags Join Table
-- =========================================================================

create table public.question_tags (
  question_id uuid not null references public.questions (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (question_id, tag_id)
);

-- Enable RLS on question_tags
alter table public.question_tags enable row level security;

-- Policies for question_tags
create policy "question_tags are readable by everyone"
  on public.question_tags for select
  using (true);

create policy "authors can manage question_tags for their own questions"
  on public.question_tags for all
  using (
    exists (
      select 1 from public.questions q
      where q.id = question_tags.question_id
        and (q.author_id = current_author_id() or is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.questions q
      where q.id = question_tags.question_id
        and (q.author_id = current_author_id() or is_admin())
    )
  );

-- Indexes for performance
create index idx_question_tags_tag on public.question_tags (tag_id);
create index idx_question_tags_question on public.question_tags (question_id);
