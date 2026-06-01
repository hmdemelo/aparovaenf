-- 001_core.sql
-- Core enums and classification reference tables for aprovaenf.
-- See specs/001-aprovaenf-mvp/data-model.md.

-- =========================================================================
-- Enums
-- =========================================================================

create type user_role as enum ('student', 'author', 'admin');

create type question_difficulty as enum ('facil', 'media', 'dificil');

create type question_source_type as enum ('autoral', 'prova_oficial');

create type question_status as enum (
  'draft',
  'published',
  'unpublished',
  'archived'
);

create type subscription_plan as enum ('monthly', 'annual');

create type subscription_status as enum (
  'pending',
  'active',
  'past_due',
  'canceled',
  'expired'
);

-- =========================================================================
-- Reference tables (classification)
-- =========================================================================

-- Careers offered. Launch careers: Enfermagem, Tecnico em enfermagem.
create table careers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  is_launch_career boolean not null default false,
  created_at timestamptz not null default now()
);

-- Exam boards (bancas). Optional on questions.
create table boards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  is_priority boolean not null default false,
  created_at timestamptz not null default now()
);

-- Subjects (assuntos), scoped per career.
create table subjects (
  id uuid primary key default gen_random_uuid(),
  career_id uuid not null references careers (id) on delete cascade,
  name text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  unique (career_id, slug)
);

create index idx_subjects_career on subjects (career_id);

-- Reference tables are public, read-only catalog data. RLS is enabled with a
-- public read policy; writes go through the service role / admin tooling only.
alter table careers enable row level security;
alter table boards enable row level security;
alter table subjects enable row level security;

create policy "careers are readable by everyone"
  on careers for select
  using (true);

create policy "boards are readable by everyone"
  on boards for select
  using (true);

create policy "subjects are readable by everyone"
  on subjects for select
  using (true);
