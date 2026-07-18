# Gemini AI Integration Setup

## 1. Get an API key

1. Open [Google AI Studio](https://aistudio.google.com/apikey)
2. Create an API key
3. Add it to your local `.env` (server-only):

```env
GEMINI_API_KEY=your_key_here
# Fast (recommended): gemini-3.1-flash-lite
# Higher quality / slower: gemini-3.5-flash
GEMINI_MODEL=gemini-3.1-flash-lite
```

Never prefix this key with `NEXT_PUBLIC_`.

## 2. Apply report status migration

Run `supabase/migrations/004_report_status.sql` in the Supabase SQL Editor.
See `docs/REPORT_ASYNC.md`.

## 3. Restart the app

```bash
npm run dev
```

## Architecture (performance)

```
Start Interview
  → QuestionService + Gemini (1 call)
  → Persist questions in Supabase

Interview Session
  → Read questions/answers from Supabase only
  → Autosave answers (no AI)

Finish Interview
  → Mark completed
  → Enqueue report job (status=pending)
  → Redirect immediately

Report Page
  → Processing UI + poll status
  → ReportGenerationService claims job
  → EvaluationService + Gemini (1 call)
  → status=completed | failed
```

UI never talks to Gemini. Services own all AI I/O.

## Prompt strategy

- **Questions**: role + experience + type + difficulty + duration → JSON list (once)
- **Evaluation**: transcript → scores + coaching JSON (once per interview)
- Zod validation, retry once, rate limiting, atomic job claims
