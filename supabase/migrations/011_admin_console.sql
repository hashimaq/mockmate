-- ============================================================
-- MockMate — Admin Console persistence
-- In-app notifications, feedback inbox, platform settings
-- Execute AFTER 010_rbac_rls_fix.sql
-- ============================================================

create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  title text not null,
  body text,
  user_email text,
  user_name text,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'unread'
    check (status in ('unread', 'read', 'archived')),
  created_at timestamptz not null default now()
);

create index if not exists admin_notifications_created_at_idx
  on public.admin_notifications (created_at desc);
create index if not exists admin_notifications_status_idx
  on public.admin_notifications (status);
create index if not exists admin_notifications_event_type_idx
  on public.admin_notifications (event_type);

alter table public.admin_notifications enable row level security;

drop policy if exists "admin_notifications_select_staff" on public.admin_notifications;
create policy "admin_notifications_select_staff"
on public.admin_notifications for select to authenticated
using (public.is_staff());

drop policy if exists "admin_notifications_update_staff" on public.admin_notifications;
create policy "admin_notifications_update_staff"
on public.admin_notifications for update to authenticated
using (public.is_staff())
with check (public.is_staff());

-- Inserts are service_role only (no insert policy for authenticated)

create table if not exists public.platform_feedback (
  id uuid primary key default gen_random_uuid(),
  category text not null
    check (category in ('contact', 'feature_request', 'bug_report', 'user_feedback')),
  subject text not null,
  message text not null,
  submitter_email text,
  submitter_name text,
  user_id uuid references public.profiles (id) on delete set null,
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'resolved', 'archived')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists platform_feedback_created_at_idx
  on public.platform_feedback (created_at desc);
create index if not exists platform_feedback_status_idx
  on public.platform_feedback (status);
create index if not exists platform_feedback_category_idx
  on public.platform_feedback (category);

alter table public.platform_feedback enable row level security;

drop policy if exists "platform_feedback_select_staff" on public.platform_feedback;
create policy "platform_feedback_select_staff"
on public.platform_feedback for select to authenticated
using (public.is_staff());

drop policy if exists "platform_feedback_update_staff" on public.platform_feedback;
create policy "platform_feedback_update_staff"
on public.platform_feedback for update to authenticated
using (public.is_staff())
with check (public.is_staff());

drop policy if exists "platform_feedback_insert_authenticated" on public.platform_feedback;
create policy "platform_feedback_insert_authenticated"
on public.platform_feedback for insert to authenticated
with check (true);

create table if not exists public.platform_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

alter table public.platform_settings enable row level security;

drop policy if exists "platform_settings_select_staff" on public.platform_settings;
create policy "platform_settings_select_staff"
on public.platform_settings for select to authenticated
using (public.is_staff());

-- Writes via service_role only after super_admin check in app

-- Seed default settings row (idempotent)
insert into public.platform_settings (key, value)
values (
  'general',
  jsonb_build_object(
    'applicationName', 'MockMate',
    'supportEmail', '',
    'notificationEmail', '',
    'maintenanceMode', false
  )
)
on conflict (key) do nothing;
