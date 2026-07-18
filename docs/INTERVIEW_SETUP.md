# Interview Management Setup

Run this after `001_profiles.sql` and `002_dashboard.sql`.

## 1. Apply migration

In **Supabase Dashboard → SQL Editor**, paste and run:

`supabase/migrations/003_interview_engine.sql`

This will:

- Extend `interviews` with experience level, planned duration, question index, elapsed time, and expiry
- Extend `answers` with draft/saved tracking and a unique constraint per question
- Create `seed_questions` catalog + RLS (authenticated read)
- Insert a small seed question set (not app mock data)

## 2. Verify tables

In Supabase Table Editor you should see:

- `interviews` columns: `experience_level`, `planned_duration_minutes`, `current_question_index`, `elapsed_seconds`, `expires_at`
- `answers` columns: `is_draft`, `saved_at`
- `seed_questions` with active rows

## 3. Smoke test

1. Sign in and open `/dashboard/interviews`
2. Complete the 5-step wizard and click **Start Interview**
3. Confirm redirect to `/dashboard/interviews/[sessionId]`
4. Answer a question, wait for draft autosave, click **Save Answer**
5. Refresh the page — timer, answers, and question index should restore
6. Finish the interview and confirm the finished empty state

## Architecture

| Service | Responsibility |
|---|---|
| `InterviewService` | Create/list/update/complete interview rows |
| `QuestionService` + `QuestionProvider` | Fetch drafts, materialize into `questions` |
| `SupabaseSeedQuestionProvider` | Temporary seed catalog reader (swap for AI later) |
| `AnswerService` | Upsert draft/final answers |
| `SessionService` | Orchestrate session load + activity logs |
| `EvaluationService` | No-op stub for future AI scoring |

UI never talks to tables directly for the interview engine — only through these services/actions.
