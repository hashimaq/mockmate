import { z } from "zod";

/** Shared UUID validation for server actions. */
export const uuidSchema = z.string().uuid("Invalid id");

export const saveAnswerInputSchema = z.object({
  interviewId: uuidSchema,
  questionId: uuidSchema,
  content: z.string().max(12000),
  isDraft: z.boolean().optional(),
});

export const syncProgressInputSchema = z.object({
  interviewId: uuidSchema,
  currentQuestionIndex: z.number().int().min(0).max(50),
  elapsedSeconds: z.number().int().min(0).max(60 * 60 * 6),
});

export const interviewIdInputSchema = z.object({
  interviewId: uuidSchema,
});

export const completeInterviewInputSchema = z.object({
  interviewId: uuidSchema,
  elapsedSeconds: z.number().int().min(0).max(60 * 60 * 6),
});

/** Strip provider/config internals from client-facing errors. */
export function toSafeClientError(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const message = error.message;
  const lower = message.toLowerCase();

  // Secrets / infra — never expose raw details
  if (
    lower.includes("api key") ||
    lower.includes("service role") ||
    lower.includes("supabase")
  ) {
    if (lower.includes("api key") || lower.includes("not configured")) {
      return "AI is temporarily unavailable. Please try again later.";
    }
    return fallback;
  }

  if (lower.includes("rate limit") || lower.includes("quota")) {
    return "Too many AI requests. Please wait a moment and try again.";
  }

  // Gemini / AI failures — clear retry copy (do not blank all "gemini" strings)
  if (
    lower.includes("gemini") ||
    lower.includes("empty response") ||
    lower.includes("failed validation") ||
    lower.includes("invalid json") ||
    lower.includes("parse") ||
    lower.includes("ai ")
  ) {
    if (lower.includes("did not return") || lower.includes("empty")) {
      return "AI returned an empty response. Please generate the report again.";
    }
    if (lower.includes("validation") || lower.includes("json")) {
      return "AI returned an incomplete report. Please generate again.";
    }
    return "AI report generation failed. Please try again in a moment.";
  }

  // Allow known user-facing validation / domain messages
  if (
    lower.includes("signed in") ||
    lower.includes("not found") ||
    lower.includes("no longer active") ||
    lower.includes("expired") ||
    lower.includes("finish the interview") ||
    lower.includes("invalid") ||
    lower.includes("must be") ||
    lower.includes("pdf") ||
    lower.includes("docx") ||
    lower.includes("resume") ||
    lower.includes("5 mb") ||
    lower.includes("extract") ||
    lower.includes("analysis") ||
    lower.includes("report")
  ) {
    return message.length > 180 ? message.slice(0, 177) + "…" : message;
  }

  if (message.length > 180) {
    return fallback;
  }

  return message;
}
