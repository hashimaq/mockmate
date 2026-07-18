# MockMate — Production Readiness Checklist

## Required before go-live

### Environment
- [ ] `NEXT_PUBLIC_SITE_URL` set to production HTTPS origin
- [ ] Supabase URL + anon key configured
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set (server-only)
- [ ] `GEMINI_API_KEY` set (server-only, never `NEXT_PUBLIC_`)
- [ ] Rotate any keys that were ever committed to git / shared chats

### Database
- [ ] `001_profiles.sql` applied
- [ ] `002_dashboard.sql` applied
- [ ] `003_interview_engine.sql` applied
- [ ] `004_report_status.sql` applied
- [ ] `005_answers_rls_harden.sql` applied
- [ ] `006_resumes.sql` applied (tables + private `resumes` storage bucket)
- [ ] `007_voice_settings.sql` applied (voice interview preferences)
- [ ] `008_interview_target_company.sql` applied (optional target company column)
- [ ] `009_rbac.sql` applied (profiles.role + status + staff RLS)
- [ ] `010_rbac_rls_fix.sql` applied (fixes staff RLS recursion — required if 009 already ran)
- [ ] `011_admin_console.sql` applied (admin notifications, feedback, settings)
- [ ] `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` set (owner login via `/login`)
- [ ] Resend keys configured for admin notifications (optional until go-live)

### Auth / Supabase
- [ ] Site URL + redirect URLs include production domain
- [ ] Google OAuth client configured for production
- [ ] Email templates / SMTP verified
- [ ] RLS enabled on all public tables (verify in dashboard)

### Quality gates
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] Smoke: register/login, start interview, answer, finish, view report
- [ ] Smoke: settings update + theme toggle
- [ ] Smoke: resume upload / replace / delete / preview
- [ ] Smoke: protected routes redirect when logged out

### Monitoring (next step — not wired yet)
- [ ] Attach Sentry (or equivalent) to `lib/monitoring/logger.ts` hooks
- [ ] Enable uptime checks on `/` and `/login`
- [ ] Alert on Gemini / Supabase error rates

### Ops
- [ ] CDN / hosting region selected
- [ ] Backups enabled for Supabase
- [ ] Rate limits reviewed for AI endpoints under load
