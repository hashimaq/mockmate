# MockMate Dashboard Setup

## SQL migrations (run in order)

Supabase Dashboard → **SQL Editor** → **New query**

1. `supabase/migrations/001_profiles.sql` (if not already run)
2. `supabase/migrations/002_dashboard.sql` ← **required for this phase**

`002_dashboard.sql` creates:

- `interviews`
- `questions`
- `answers`
- `reports`
- `activity_logs`

…with indexes + RLS (own-row access only).

## After login

Users land on `/dashboard`.

Legacy `/settings` redirects to `/dashboard/settings`.

## Notes

- All dashboard stats, charts, history, and activity come from Supabase only.
- If a user has no interviews yet, the UI shows empty states + CTAs (no mock/sample data).
- Interview generation / AI / voice are intentionally not implemented yet.
