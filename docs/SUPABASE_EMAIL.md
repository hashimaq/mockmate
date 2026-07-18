# Fix: Verification emails not arriving

MockMate signup emails are sent by **Supabase Auth**, not by the Resend admin-notification key alone.

## 1. Vercel env (required)

Set production site URL (not localhost):

```env
NEXT_PUBLIC_SITE_URL=https://mockmate-weld-iota.vercel.app
```

Redeploy after saving.

## 2. Supabase Auth URLs

Supabase Dashboard → **Authentication → URL Configuration**

- **Site URL:** `https://mockmate-weld-iota.vercel.app`
- **Redirect URLs** (add both — required for Google OAuth too):
  - `https://mockmate-weld-iota.vercel.app/**`
  - `https://mockmate-weld-iota.vercel.app/auth/callback`

## 3. Custom SMTP with Resend (strongly recommended)

Supabase’s built-in mailer is slow, rate-limited, and often never arrives.

1. Resend → verify a domain (or use a verified sender)
2. Supabase → **Project Settings → Authentication → SMTP Settings** → Enable
3. Use:

| Field | Value |
|-------|--------|
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | your `RESEND_API_KEY` |
| Sender email | a **verified** Resend address (not a random Gmail unless verified) |

Without a verified domain, Resend will not deliver reliably.

## 4. Confirm email setting

Authentication → **Providers → Email**

- “Confirm email” enabled → users must click the link (emails must work)
- For quick testing only, you can temporarily disable confirm email (not for production)

### If signup shows “Error sending confirmation email” / 500

That comes from Supabase Auth (not MockMate). Built-in mailer is failing.

**Fast unblock (testing):** Auth → Providers → Email → turn **Confirm email** OFF → save  
**Proper fix:** enable **custom SMTP** (section 3 above) with Resend, then turn Confirm email back ON.

MockMate also has a server fallback: if confirmation email fails and `SUPABASE_SERVICE_ROLE_KEY` is set on Vercel, it creates a confirmed user so signup can still succeed. Still configure SMTP for real verification emails.

## 5. App “Resend verification” button

`/verify-email` has **Resend verification email**. Use it after SMTP + Site URL are fixed.

## 6. Quick checks

- Spam / Promotions folder
- Supabase → **Authentication → Users** — is the user created? Unconfirmed?
- Supabase → **Logs** — Auth / email errors
