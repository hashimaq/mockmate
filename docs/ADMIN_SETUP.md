# Admin Panel & RBAC Setup

## 1. Apply migration

Run in Supabase SQL Editor:

- `supabase/migrations/009_rbac.sql`
- `supabase/migrations/010_rbac_rls_fix.sql` (required if you already ran an older 009)
- `supabase/migrations/011_admin_console.sql` (notifications, feedback, platform settings)

## 2. Environment variables

### Local (`.env`)

```env
SUPER_ADMIN_EMAIL=your-email@example.com
SUPER_ADMIN_PASSWORD=your-strong-password
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # service_role secret, NOT anon
RESEND_API_KEY=
ADMIN_NOTIFICATION_EMAIL=your-email@example.com
RESEND_FROM_EMAIL=MockMate <onboarding@resend.dev>
CRON_SECRET=long-random-string
```

### Vercel (production) — required for the live site

Local `.env` is **not** used on Vercel. Set these in  
**Vercel → Project → Settings → Environment Variables** → scope **Production** (and Preview if needed):

| Name | Notes |
|------|--------|
| `NEXT_PUBLIC_SITE_URL` | `https://your-app.vercel.app` (no trailing slash) |
| `NEXT_PUBLIC_SUPABASE_URL` | Same project as keys |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / public key |
| `SUPABASE_SERVICE_ROLE_KEY` | **service_role** secret (never the anon key) |
| `SUPER_ADMIN_EMAIL` | Owner login email |
| `SUPER_ADMIN_PASSWORD` | Strong password (8+ chars, mixed case + number) |
| `GEMINI_API_KEY` | Server-only |
| `RESEND_API_KEY` / `ADMIN_NOTIFICATION_EMAIL` | Optional notifications |

After saving vars: **Deployments → … → Redeploy** (env changes apply only on a new deploy).

## 3. Become Super Admin

1. Set `SUPER_ADMIN_EMAIL` + `SUPER_ADMIN_PASSWORD` + `SUPABASE_SERVICE_ROLE_KEY` on **Vercel** (not only `.env`)
2. Use a **strong** password (e.g. `Admin123!`)
3. **Redeploy** on Vercel
4. Open the live `/login` page and sign in with those exact values
5. On login, the app creates the Auth user if missing, syncs the password from env, and sets `role = super_admin`
6. You are redirected to `/admin`

Same login page as everyone else — no separate admin login.

## 4. Daily digest cron (optional)

Vercel Cron / external scheduler:

```
GET /api/cron/daily-digest
Authorization: Bearer $CRON_SECRET
```

## Roles

| Role | Access |
|------|--------|
| `user` | `/dashboard` only |
| `admin` | `/admin` (no super-admin role changes) |
| `super_admin` | Full admin + promote/demote admins |
