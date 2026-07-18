-- ============================================================
-- MockMate — Dashboard domain schema
-- Execute in: Supabase Dashboard → SQL Editor → New query
-- Run AFTER 001_profiles.sql
-- ============================================================

-- Shared updated_at helper (idempotent)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- interviews
-- ------------------------------------------------------------
create table if not exists public.interviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  interview_type text not null default 'mixed'
    check (interview_type in ('technical', 'behavioral', 'hr', 'mixed')),
  role_target text,
  difficulty text not null default 'medium'
    check (difficulty in ('easy', 'medium', 'hard')),
  status text not null default 'draft'
    check (status in ('draft', 'in_progress', 'completed', 'abandoned')),
  score numeric(5,2),
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists interviews_user_id_idx on public.interviews (user_id);
create index if not exists interviews_user_status_idx on public.interviews (user_id, status);
create index if not exists interviews_created_at_idx on public.interviews (created_at desc);

drop trigger if exists interviews_set_updated_at on public.interviews;
create trigger interviews_set_updated_at
before update on public.interviews
for each row execute function public.set_updated_at();

alter table public.interviews enable row level security;

drop policy if exists "interviews_select_own" on public.interviews;
create policy "interviews_select_own"
on public.interviews for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "interviews_insert_own" on public.interviews;
create policy "interviews_insert_own"
on public.interviews for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "interviews_update_own" on public.interviews;
create policy "interviews_update_own"
on public.interviews for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "interviews_delete_own" on public.interviews;
create policy "interviews_delete_own"
on public.interviews for delete to authenticated
using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- questions
-- ------------------------------------------------------------
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references public.interviews (id) on delete cascade,
  prompt text not null,
  category text,
  order_index integer not null default 0 check (order_index >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists questions_interview_id_idx on public.questions (interview_id);
create index if not exists questions_interview_order_idx on public.questions (interview_id, order_index);

drop trigger if exists questions_set_updated_at on public.questions;
create trigger questions_set_updated_at
before update on public.questions
for each row execute function public.set_updated_at();

alter table public.questions enable row level security;

drop policy if exists "questions_select_own" on public.questions;
create policy "questions_select_own"
on public.questions for select to authenticated
using (
  exists (
    select 1 from public.interviews i
    where i.id = questions.interview_id and i.user_id = auth.uid()
  )
);

drop policy if exists "questions_insert_own" on public.questions;
create policy "questions_insert_own"
on public.questions for insert to authenticated
with check (
  exists (
    select 1 from public.interviews i
    where i.id = questions.interview_id and i.user_id = auth.uid()
  )
);

drop policy if exists "questions_update_own" on public.questions;
create policy "questions_update_own"
on public.questions for update to authenticated
using (
  exists (
    select 1 from public.interviews i
    where i.id = questions.interview_id and i.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.interviews i
    where i.id = questions.interview_id and i.user_id = auth.uid()
  )
);

drop policy if exists "questions_delete_own" on public.questions;
create policy "questions_delete_own"
on public.questions for delete to authenticated
using (
  exists (
    select 1 from public.interviews i
    where i.id = questions.interview_id and i.user_id = auth.uid()
  )
);

-- ------------------------------------------------------------
-- answers
-- ------------------------------------------------------------
create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  interview_id uuid not null references public.interviews (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  content text not null default '',
  score numeric(5,2),
  feedback text,
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists answers_question_id_idx on public.answers (question_id);
create index if not exists answers_interview_id_idx on public.answers (interview_id);
create index if not exists answers_user_id_idx on public.answers (user_id);

drop trigger if exists answers_set_updated_at on public.answers;
create trigger answers_set_updated_at
before update on public.answers
for each row execute function public.set_updated_at();

alter table public.answers enable row level security;

drop policy if exists "answers_select_own" on public.answers;
create policy "answers_select_own"
on public.answers for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "answers_insert_own" on public.answers;
create policy "answers_insert_own"
on public.answers for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "answers_update_own" on public.answers;
create policy "answers_update_own"
on public.answers for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "answers_delete_own" on public.answers;
create policy "answers_delete_own"
on public.answers for delete to authenticated
using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- reports
-- ------------------------------------------------------------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null unique references public.interviews (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  overall_score numeric(5,2),
  summary text,
  strengths text[] not null default '{}',
  improvements text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reports_user_id_idx on public.reports (user_id);
create index if not exists reports_interview_id_idx on public.reports (interview_id);

drop trigger if exists reports_set_updated_at on public.reports;
create trigger reports_set_updated_at
before update on public.reports
for each row execute function public.set_updated_at();

alter table public.reports enable row level security;

drop policy if exists "reports_select_own" on public.reports;
create policy "reports_select_own"
on public.reports for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own"
on public.reports for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "reports_update_own" on public.reports;
create policy "reports_update_own"
on public.reports for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "reports_delete_own" on public.reports;
create policy "reports_delete_own"
on public.reports for delete to authenticated
using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- activity_logs
-- ------------------------------------------------------------
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  interview_id uuid references public.interviews (id) on delete set null,
  action text not null,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_logs_user_id_idx on public.activity_logs (user_id);
create index if not exists activity_logs_user_created_idx on public.activity_logs (user_id, created_at desc);

alter table public.activity_logs enable row level security;

drop policy if exists "activity_logs_select_own" on public.activity_logs;
create policy "activity_logs_select_own"
on public.activity_logs for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "activity_logs_insert_own" on public.activity_logs;
create policy "activity_logs_insert_own"
on public.activity_logs for insert to authenticated
with check (auth.uid() = user_id);
