-- ============================================================
-- MockMate — Fix RBAC RLS recursion
-- 009 policies queried profiles inside profiles policies →
-- infinite recursion → dashboard queries fail for all users.
-- Execute AFTER 009_rbac.sql
-- ============================================================

-- Bypass RLS when checking the caller's role (safe: only reads auth.uid() row)
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('admin', 'super_admin')
      and status = 'active'
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'super_admin'
      and status = 'active'
  );
$$;

revoke all on function public.is_staff() from public;
revoke all on function public.is_super_admin() from public;
grant execute on function public.is_staff() to authenticated;
grant execute on function public.is_super_admin() to authenticated;

-- Recreate staff policies without recursive profiles subqueries
drop policy if exists "profiles_select_staff" on public.profiles;
create policy "profiles_select_staff"
on public.profiles for select to authenticated
using (public.is_staff());

drop policy if exists "interviews_select_staff" on public.interviews;
create policy "interviews_select_staff"
on public.interviews for select to authenticated
using (public.is_staff());

drop policy if exists "reports_select_staff" on public.reports;
create policy "reports_select_staff"
on public.reports for select to authenticated
using (public.is_staff());

drop policy if exists "resumes_select_staff" on public.resumes;
create policy "resumes_select_staff"
on public.resumes for select to authenticated
using (public.is_staff());

drop policy if exists "activity_logs_select_staff" on public.activity_logs;
create policy "activity_logs_select_staff"
on public.activity_logs for select to authenticated
using (public.is_staff());
