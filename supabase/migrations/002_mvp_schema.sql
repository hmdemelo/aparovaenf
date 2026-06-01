-- 002_mvp_schema.sql
-- Core domain tables for the aprovaenf MVP.
-- See specs/001-aprovaenf-mvp/data-model.md.

-- =========================================================================
-- updated_at trigger helper
-- =========================================================================

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================================
-- User profiles (1:1 with auth.users)
-- =========================================================================

create table user_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null default 'student',
  name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_user_profiles_role on user_profiles (role);

create trigger trg_user_profiles_updated_at
  before update on user_profiles
  for each row execute function set_updated_at();

-- =========================================================================
-- Author profiles
-- =========================================================================

create table author_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references user_profiles (id) on delete cascade,
  display_name text not null,
  short_bio text,
  photo_url text,
  instagram text,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_author_profiles_user on author_profiles (user_id);

create trigger trg_author_profiles_updated_at
  before update on author_profiles
  for each row execute function set_updated_at();

-- =========================================================================
-- Questions
-- =========================================================================

create table questions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references author_profiles (id) on delete restrict,
  career_id uuid not null references careers (id) on delete restrict,
  board_id uuid references boards (id) on delete set null,
  subject_id uuid not null references subjects (id) on delete restrict,
  difficulty question_difficulty not null,
  source_type question_source_type not null default 'autoral',
  source_orgao text,
  source_cargo text,
  source_year int,
  source_reference text,
  statement text not null,
  general_comment text,
  status question_status not null default 'draft',
  annulled boolean not null default false,
  answer_key_changed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

-- Indexes for the main feed and admin filters (avoid select * on these paths).
create index idx_questions_career on questions (career_id);
create index idx_questions_board on questions (board_id);
create index idx_questions_subject on questions (subject_id);
create index idx_questions_difficulty on questions (difficulty);
create index idx_questions_status on questions (status);
create index idx_questions_author on questions (author_id);
-- Composite index for the common feed query: published questions by career.
create index idx_questions_feed on questions (career_id, status)
  where status = 'published';

create trigger trg_questions_updated_at
  before update on questions
  for each row execute function set_updated_at();

-- =========================================================================
-- Alternatives (variable count per question)
-- =========================================================================

create table alternatives (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions (id) on delete cascade,
  label text not null,
  text text not null,
  is_correct boolean not null default false,
  alternative_comment text,
  position int not null default 0,
  created_at timestamptz not null default now(),
  unique (question_id, position)
);

create index idx_alternatives_question on alternatives (question_id);
-- Enforce at most one correct alternative per question.
create unique index idx_alternatives_one_correct
  on alternatives (question_id)
  where is_correct;

-- =========================================================================
-- Answer attempts
-- =========================================================================

create table answer_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references user_profiles (id) on delete cascade,
  anonymous_session_id uuid,
  question_id uuid not null references questions (id) on delete cascade,
  selected_alternative_id uuid not null references alternatives (id) on delete restrict,
  is_correct boolean not null,
  career_id uuid references careers (id) on delete set null,
  board_id uuid references boards (id) on delete set null,
  answered_at timestamptz not null default now(),
  -- Either an authenticated user or an anonymous session must own the attempt.
  constraint answer_attempts_owner_present
    check (user_id is not null or anonymous_session_id is not null)
);

create index idx_answer_attempts_user on answer_attempts (user_id);
create index idx_answer_attempts_anon on answer_attempts (anonymous_session_id);
create index idx_answer_attempts_question on answer_attempts (question_id);
-- Used by trial counting and error history.
create index idx_answer_attempts_user_answered on answer_attempts (user_id, answered_at);

-- =========================================================================
-- Favorites (subscribers only, enforced server-side + RLS)
-- =========================================================================

create table favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles (id) on delete cascade,
  question_id uuid not null references questions (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, question_id)
);

create index idx_favorites_user on favorites (user_id);

-- =========================================================================
-- Subscriptions
-- =========================================================================

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles (id) on delete cascade,
  plan subscription_plan not null,
  status subscription_status not null default 'pending',
  provider text not null default 'abacate_pay',
  provider_customer_id text,
  provider_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_subscriptions_user on subscriptions (user_id);
create index idx_subscriptions_status on subscriptions (status);
-- One active subscription per user.
create unique index idx_subscriptions_one_active
  on subscriptions (user_id)
  where status = 'active';

create trigger trg_subscriptions_updated_at
  before update on subscriptions
  for each row execute function set_updated_at();

-- =========================================================================
-- Payment events (idempotent webhook ledger)
-- =========================================================================

create table payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'abacate_pay',
  provider_event_id text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  processing_status text not null default 'received',
  error_message text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  -- Idempotency key: a provider event is processed at most once.
  unique (provider, provider_event_id)
);

create index idx_payment_events_status on payment_events (processing_status);

-- =========================================================================
-- Product events (internal funnel analytics)
-- =========================================================================

create table product_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references user_profiles (id) on delete set null,
  anonymous_session_id uuid,
  event_name text not null,
  career_id uuid references careers (id) on delete set null,
  question_id uuid references questions (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_product_events_name on product_events (event_name);
create index idx_product_events_user on product_events (user_id);
create index idx_product_events_created on product_events (created_at);
