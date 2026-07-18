# MockMate Auth Setup

## 1. Environment variables

Copy `.env.example` to `.env.local` (or use `.env`) and set:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

`SUPABASE_SERVICE_ROLE_KEY` is required only for **Delete account**. Never expose it to the browser.

## 2. Run SQL migration

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project
2. Go to **SQL Editor** → **New query**
3. Paste and run the contents of:

`supabase/migrations/001_profiles.sql`

This creates:

- `public.profiles` table + RLS policies
- Trigger to auto-create a profile on signup
- `avatars` storage bucket + policies

## 3. Auth providers

### Email / Password

1. **Authentication** → **Providers** → **Email**
2. Enable Email provider
3. Optional: disable “Confirm email” for local testing

### Google OAuth

1. **Authentication** → **Providers** → **Google** → Enable
2. Add Google OAuth Client ID / Secret
3. Authorized redirect URI in Google Cloud:

`https://YOUR_PROJECT.supabase.co/auth/v1/callback`

4. In Supabase **URL Configuration**:
   - Site URL: `http://localhost:3000` (prod: your domain)
   - Redirect URLs include:
     - `http://localhost:3000/auth/callback`
     - `https://YOUR_DOMAIN/auth/callback`

## 4. Verify

```bash
npm run dev
```

- Register → profile row appears in `profiles`
- Login / logout / forgot password
- Settings: name, email, password, avatar, theme, delete
