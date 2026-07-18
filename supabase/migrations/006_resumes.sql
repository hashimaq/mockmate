-- ============================================================
-- MockMate — Resume Intelligence
-- Execute AFTER 001–005 migrations
-- ============================================================

-- ------------------------------------------------------------
-- resumes (one active resume per user)
-- ------------------------------------------------------------
create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_size integer not null check (file_size > 0 and file_size <= 5242880),
  mime_type text not null
    check (mime_type in (
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )),
  uploaded_at timestamptz not null default now(),
  analysis_status text not null default 'pending'
    check (analysis_status in ('pending', 'processing', 'completed', 'failed')),
  error_message text,
  extracted_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists resumes_user_id_idx on public.resumes (user_id);
create index if not exists resumes_analysis_status_idx on public.resumes (analysis_status);

drop trigger if exists resumes_set_updated_at on public.resumes;
create trigger resumes_set_updated_at
before update on public.resumes
for each row execute function public.set_updated_at();

alter table public.resumes enable row level security;

drop policy if exists "resumes_select_own" on public.resumes;
create policy "resumes_select_own"
on public.resumes for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "resumes_insert_own" on public.resumes;
create policy "resumes_insert_own"
on public.resumes for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "resumes_update_own" on public.resumes;
create policy "resumes_update_own"
on public.resumes for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "resumes_delete_own" on public.resumes;
create policy "resumes_delete_own"
on public.resumes for delete to authenticated
using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- resume_analysis
-- ------------------------------------------------------------
create table if not exists public.resume_analysis (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid not null unique references public.resumes (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  personal_summary text,
  skills text[] not null default '{}',
  programming_languages text[] not null default '{}',
  frameworks text[] not null default '{}',
  libraries text[] not null default '{}',
  databases text[] not null default '{}',
  cloud_platforms text[] not null default '{}',
  tools text[] not null default '{}',
  projects jsonb not null default '[]'::jsonb,
  work_experience jsonb not null default '[]'::jsonb,
  education jsonb not null default '[]'::jsonb,
  certifications text[] not null default '{}',
  soft_skills text[] not null default '{}',
  years_of_experience numeric(4,1),
  career_level text,
  health_score integer check (health_score is null or (health_score >= 0 and health_score <= 100)),
  suggestions text[] not null default '{}',
  raw_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists resume_analysis_user_id_idx on public.resume_analysis (user_id);
create index if not exists resume_analysis_resume_id_idx on public.resume_analysis (resume_id);

drop trigger if exists resume_analysis_set_updated_at on public.resume_analysis;
create trigger resume_analysis_set_updated_at
before update on public.resume_analysis
for each row execute function public.set_updated_at();

alter table public.resume_analysis enable row level security;

drop policy if exists "resume_analysis_select_own" on public.resume_analysis;
create policy "resume_analysis_select_own"
on public.resume_analysis for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "resume_analysis_insert_own" on public.resume_analysis;
create policy "resume_analysis_insert_own"
on public.resume_analysis for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "resume_analysis_update_own" on public.resume_analysis;
create policy "resume_analysis_update_own"
on public.resume_analysis for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "resume_analysis_delete_own" on public.resume_analysis;
create policy "resume_analysis_delete_own"
on public.resume_analysis for delete to authenticated
using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- Storage: private resumes bucket
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resumes',
  'resumes',
  false,
  5242880,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "resumes_storage_select_own" on storage.objects;
create policy "resumes_storage_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'resumes'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "resumes_storage_insert_own" on storage.objects;
create policy "resumes_storage_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'resumes'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "resumes_storage_update_own" on storage.objects;
create policy "resumes_storage_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'resumes'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'resumes'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "resumes_storage_delete_own" on storage.objects;
create policy "resumes_storage_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'resumes'
  and (storage.foldername(name))[1] = auth.uid()::text
);
