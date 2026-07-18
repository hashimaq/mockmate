-- ============================================================
-- MockMate — Company-specific interview target (additive)
-- Execute AFTER 001–007 migrations
-- ============================================================

alter table public.interviews
  add column if not exists target_company text;

create index if not exists interviews_user_company_idx
  on public.interviews (user_id, target_company);
