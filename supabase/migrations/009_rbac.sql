-- ============================================================
-- MockMate — RBAC (roles + account status)
-- Additive — does not remove existing policies
-- Execute AFTER 001–008 migrations
-- ============================================================

alter table public.profiles
  add column if not exists role text not null default 'user'
    check (role in ('super_admin', 'admin', 'user'));

alter table public.profiles
  add column if not exists status text not null default 'active'
    check (status in ('active', 'suspended'));

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_status_idx on public.profiles (status);
create index if not exists profiles_created_at_idx on public.profiles (created_at desc);

-- Staff role check without RLS recursion (used by policies below)
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

revoke all on function public.is_staff() from public;
grant execute on function public.is_staff() to authenticated;

-- Admins / super_admins can read all profiles (for admin panel)
drop policy if exists "profiles_select_staff" on public.profiles;
create policy "profiles_select_staff"
on public.profiles for select to authenticated
using (public.is_staff());

-- Block privilege escalation: only service_role may change role/status
create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    if (new.role is distinct from old.role)
       or (new.status is distinct from old.status) then
      if coalesce(auth.role(), '') <> 'service_role' then
        raise exception 'Not allowed to change role or status';
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_privilege_escalation on public.profiles;
create trigger profiles_prevent_privilege_escalation
before update on public.profiles
for each row execute function public.prevent_profile_privilege_escalation();

-- Staff can read interviews/reports for ops (select only)
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
