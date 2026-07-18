-- ============================================================
-- MockMate — Voice Interview settings
-- Additive only — does not alter existing tables
-- Execute AFTER 001–006 migrations
-- ============================================================

create table if not exists public.voice_settings (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  enable_voice_mode boolean not null default true,
  auto_read_questions boolean not null default false,
  speech_rate numeric(3,2) not null default 1.00
    check (speech_rate >= 0.5 and speech_rate <= 2.0),
  preferred_voice text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists voice_settings_set_updated_at on public.voice_settings;
create trigger voice_settings_set_updated_at
before update on public.voice_settings
for each row execute function public.set_updated_at();

alter table public.voice_settings enable row level security;

drop policy if exists "voice_settings_select_own" on public.voice_settings;
create policy "voice_settings_select_own"
on public.voice_settings for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "voice_settings_insert_own" on public.voice_settings;
create policy "voice_settings_insert_own"
on public.voice_settings for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "voice_settings_update_own" on public.voice_settings;
create policy "voice_settings_update_own"
on public.voice_settings for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "voice_settings_delete_own" on public.voice_settings;
create policy "voice_settings_delete_own"
on public.voice_settings for delete to authenticated
using (auth.uid() = user_id);
