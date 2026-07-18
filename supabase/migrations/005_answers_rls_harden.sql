-- ============================================================
-- MockMate — Harden answers RLS ownership
-- Execute AFTER 002_dashboard.sql
-- Ensures answers can only target the caller's interview questions
-- ============================================================

drop policy if exists "answers_insert_own" on public.answers;
create policy "answers_insert_own"
on public.answers
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.interviews i
    join public.questions q on q.interview_id = i.id
    where i.id = answers.interview_id
      and q.id = answers.question_id
      and i.user_id = auth.uid()
  )
);

drop policy if exists "answers_update_own" on public.answers;
create policy "answers_update_own"
on public.answers
for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.interviews i
    join public.questions q on q.interview_id = i.id
    where i.id = answers.interview_id
      and q.id = answers.question_id
      and i.user_id = auth.uid()
  )
);
