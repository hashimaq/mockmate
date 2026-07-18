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

  if (
    lower.includes("api key") ||
    lower.includes("gemini") ||
    lower.includes("quota") ||
    lower.includes("permission") ||
    lower.includes("service role") ||
    lower.includes("supabase")
  ) {
    if (lower.includes("rate limit")) {
      return "Too many AI requests. Please wait a moment and try again.";
    }
    if (lower.includes("api key") || lower.includes("not configured")) {
      return "AI is temporarily unavailable. Please try again later.";
    }
    return fallback;
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
    lower.includes("analysis")
  ) {
    return message;
  }

  if (message.length > 180) {
    return fallback;
  }

  return message;
}
