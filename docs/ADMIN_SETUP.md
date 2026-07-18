# Admin Panel & RBAC Setup

## 1. Apply migration

Run in Supabase SQL Editor:

- `supabase/migrations/009_rbac.sql`
- `supabase/migrations/010_rbac_rls_fix.sql` (required if you already ran an older 009)
- `supabase/migrations/011_admin_console.sql` (notifications, feedback, platform settings)

## 2. Environment variables

Add to `.env` (never commit secrets):

```env
SUPER_ADMIN_EMAIL=your-email@example.com
SUPER_ADMIN_PASSWORD=your-strong-password
RESEND_API_KEY=
ADMIN_NOTIFICATION_EMAIL=your-email@example.com
RESEND_FROM_EMAIL=MockMate <onboarding@resend.dev>
CRON_SECRET=long-random-string
```

## 3. Become Super Admin

1. Set `SUPER_ADMIN_EMAIL` + `SUPER_ADMIN_PASSWORD` in `.env`
2. Use a **strong** password (Supabase often requires uppercase + lowercase + number), e.g. `Admin123!`
3. **Restart** `npm run dev` after editing `.env`
4. Open the **existing** `/login` page and sign in with those exact values
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
