-- ============================================================
-- MockMate — Interview session engine
-- Execute in: Supabase Dashboard → SQL Editor → New query
-- Run AFTER 001_profiles.sql and 002_dashboard.sql
-- ============================================================

-- Extend interviews for wizard + recovery
alter table public.interviews
  add column if not exists experience_level text
    check (experience_level in ('intern', 'junior', 'mid', 'senior'));

alter table public.interviews
  add column if not exists planned_duration_minutes integer
    check (planned_duration_minutes is null or planned_duration_minutes > 0);

alter table public.interviews
  add column if not exists current_question_index integer not null default 0
    check (current_question_index >= 0);

alter table public.interviews
  add column if not exists elapsed_seconds integer not null default 0
    check (elapsed_seconds >= 0);

alter table public.interviews
  add column if not exists expires_at timestamptz;

create index if not exists interviews_user_level_idx
  on public.interviews (experience_level);

-- Answers: draft / saved tracking
alter table public.answers
  add column if not exists is_draft boolean not null default true;

alter table public.answers
  add column if not exists saved_at timestamptz;

-- Unique answer per question (one response per question)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'answers_question_id_key'
  ) then
    alter table public.answers
      add constraint answers_question_id_key unique (question_id);
  end if;
end $$;

-- ------------------------------------------------------------
-- seed_questions (catalog for temporary QuestionService provider)
-- Not user-owned interview data — replaceable by AI later
-- ------------------------------------------------------------
create table if not exists public.seed_questions (
  id uuid primary key default gen_random_uuid(),
  interview_type text not null
    check (interview_type in ('technical', 'behavioral', 'hr', 'mixed')),
  role_target text,
  experience_level text
    check (experience_level is null or experience_level in ('intern', 'junior', 'mid', 'senior')),
  difficulty text not null
    check (difficulty in ('easy', 'medium', 'hard')),
  prompt text not null,
  category text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists seed_questions_lookup_idx
  on public.seed_questions (interview_type, difficulty, is_active);

create index if not exists seed_questions_role_idx
  on public.seed_questions (role_target);

alter table public.seed_questions enable row level security;

drop policy if exists "seed_questions_select_authenticated" on public.seed_questions;
create policy "seed_questions_select_authenticated"
on public.seed_questions
for select
to authenticated
using (is_active = true);

-- Seed a small catalog (idempotent via prompt uniqueness helper)
-- Clear and re-insert known seed set for predictable local/dev setups
delete from public.seed_questions
where prompt in (
  'Walk me through how you would structure a reusable React component library.',
  'How do you manage state in a large React application?',
  'Explain the difference between server-side and client-side rendering.',
  'Describe a time you disagreed with a teammate and how you resolved it.',
  'Tell me about a project you are proud of and why.',
  'How do you prioritize tasks when everything feels urgent?',
  'Why do you want to work in this role?',
  'What are your strengths and areas you are improving?',
  'How do you handle feedback from managers or peers?',
  'How would you design a REST API for a job board application?',
  'What is the difference between SQL and NoSQL databases?',
  'How do you debug a production issue under time pressure?'
);

insert into public.seed_questions
  (interview_type, role_target, experience_level, difficulty, prompt, category)
values
  ('technical', 'Frontend Developer', 'junior', 'easy',
   'Walk me through how you would structure a reusable React component library.', 'frontend'),
  ('technical', 'React Developer', 'mid', 'medium',
   'How do you manage state in a large React application?', 'frontend'),
  ('technical', 'Full Stack Developer', 'mid', 'medium',
   'Explain the difference between server-side and client-side rendering.', 'fullstack'),
  ('technical', 'Backend Developer', 'junior', 'easy',
   'How would you design a REST API for a job board application?', 'backend'),
  ('technical', 'Backend Developer', 'mid', 'medium',
   'What is the difference between SQL and NoSQL databases?', 'backend'),
  ('technical', 'DevOps Engineer', 'mid', 'hard',
   'How do you debug a production issue under time pressure?', 'devops'),
  ('behavioral', null, 'junior', 'easy',
   'Describe a time you disagreed with a teammate and how you resolved it.', 'teamwork'),
  ('behavioral', null, 'mid', 'medium',
   'Tell me about a project you are proud of and why.', 'impact'),
  ('behavioral', null, 'senior', 'hard',
   'How do you prioritize tasks when everything feels urgent?', 'prioritization'),
  ('hr', null, 'intern', 'easy',
   'Why do you want to work in this role?', 'motivation'),
  ('hr', null, 'junior', 'easy',
   'What are your strengths and areas you are improving?', 'self-awareness'),
  ('hr', null, 'mid', 'medium',
   'How do you handle feedback from managers or peers?', 'growth'),
  ('mixed', 'Full Stack Developer', 'junior', 'easy',
   'Walk me through how you would structure a reusable React component library.', 'frontend'),
  ('mixed', null, 'mid', 'medium',
   'Describe a time you disagreed with a teammate and how you resolved it.', 'teamwork'),
  ('mixed', null, 'junior', 'easy',
   'Why do you want to work in this role?', 'motivation');
