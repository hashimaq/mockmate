# Resume Intelligence Setup

## 1. Apply database + storage migration

Run in the Supabase SQL Editor (after `001`–`005`):

- `supabase/migrations/006_resumes.sql`

This creates:

- `public.resumes` (one row per user)
- `public.resume_analysis`
- Private Storage bucket `resumes` (5 MB, PDF/DOCX)
- RLS so users can only access their own files and rows

## 2. Environment variables

No new keys are required. Resume analysis uses the existing Gemini config:

```env
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-3.1-flash-lite
```

Also ensure:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## 3. Restart the app

```bash
npm run dev
```

Open `/dashboard/resume`.

## Architecture

```
UI (Resume page)
  → server actions (features/resumes/actions)
    → ResumeProvider
      → ResumeService (CRUD + async analysis claim)
      → StorageService (Supabase Storage + signed URLs)
      → ResumeParser (PDF/DOCX text extraction)
      → ResumeAnalysisService (Gemini structured JSON)
```

Interview question generation and report evaluation optionally load completed resume analysis via `ResumeProvider.getInterviewContext`. Users without a resume keep the previous behavior.

## Testing checklist

- [ ] Upload PDF under 5 MB → status moves pending → processing → completed
- [ ] Upload DOCX under 5 MB → analysis completes
- [ ] Reject unsupported type (e.g. `.txt`)
- [ ] Reject file over 5 MB
- [ ] Replace resume replaces file and re-runs analysis
- [ ] Preview opens a signed URL
- [ ] Download works
- [ ] Delete removes DB row + storage object
- [ ] Retry works after a failed analysis
- [ ] Start interview with analyzed resume → questions reference projects/skills
- [ ] Finish interview → report shows Resume alignment insights when analysis exists
- [ ] Another user’s resume is not readable (RLS)
- [ ] `npm run lint` / `npm run build` pass
