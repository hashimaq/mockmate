# Async AI Report Workflow

Run after `003_interview_engine.sql`.

## 1. Apply migration

In **Supabase → SQL Editor**, run:

`supabase/migrations/004_report_status.sql`

Adds to `reports`:

- `status` — `pending` | `processing` | `completed` | `failed`
- `error_message`
- `started_at`
- `completed_at`

## 2. How it works

| Step | Gemini? | User wait |
|---|---|---|
| Start interview | **Once** — questions stored in Supabase | Wizard spinner |
| During interview | **Never** — questions/answers from DB | Instant |
| Finish interview | No — marks completed + enqueues job | Instant redirect |
| Report page | **Once** — evaluation job | Processing UI + poll |

Duplicate report jobs are blocked with an atomic status claim.

## 3. Services

- `QuestionService` — materialize once at start
- `ReportGenerationService` — claim → evaluate → persist
- `EvaluationService` / `AIService` — Gemini only
- `NotificationService` — activity log events
- `ReportService` — status CRUD
