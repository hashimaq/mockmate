-- ============================================================
-- MockMate — Async AI report generation status
-- Execute in: Supabase Dashboard → SQL Editor → New query
-- Run AFTER 003_interview_engine.sql
-- ============================================================

alter table public.reports
  add column if not exists status text not null default 'completed'
    check (status in ('pending', 'processing', 'completed', 'failed'));

alter table public.reports
  add column if not exists error_message text;

alter table public.reports
  add column if not exists started_at timestamptz;

alter table public.reports
  add column if not exists completed_at timestamptz;

create index if not exists reports_user_status_idx
  on public.reports (user_id, status);

create index if not exists reports_status_started_idx
  on public.reports (status, started_at);

comment on column public.reports.status is
  'Async AI report job: pending | processing | completed | failed';
