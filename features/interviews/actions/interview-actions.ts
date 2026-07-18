"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";

import {
  createInterviewSchema,
  resolveDurationMinutes,
  type CreateInterviewFormInput,
} from "@/features/interviews/schemas/interview";
import { PromptBuilder } from "@/services/ai/prompt-builder";
import { captureException } from "@/lib/monitoring/logger";
import {
  completeInterviewInputSchema,
  interviewIdInputSchema,
  saveAnswerInputSchema,
  syncProgressInputSchema,
  toSafeClientError,
} from "@/lib/security/action-validation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, getSessionUser } from "@/services/auth";
import { notifyAdminEvent } from "@/services/notifications/admin-email-service";
import { ReportGenerationService } from "@/services/reports/report-generation-service";
import { ResumeProvider } from "@/services/resumes/resume-provider";
import { isResumeInterviewTitle } from "@/features/resumes/lib/resume-interview-gate";
import { SessionService } from "@/services/sessions/session-service";
import type { ReportStatus } from "@/types/database";

export type InterviewActionResult = {
  success: boolean;
  error?: string;
  sessionId?: string;
  reportReady?: boolean;
  reportStatus?: ReportStatus | "none";
};

function isNextRedirectError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  if (!("digest" in error)) return false;
  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

function mapAiError(error: unknown): string {
  return toSafeClientError(
    error,
    "Something went wrong with AI generation",
  );
}

function scheduleReportJob(userId: string, interviewId: string) {
  after(async () => {
    try {
      const supabase = await createClient();
      const generation = new ReportGenerationService(supabase);
      await generation.processJob(userId, interviewId);
      revalidatePath(`/dashboard/reports/${interviewId}`);
      revalidatePath("/dashboard/reports");
    } catch (error) {
      captureException(error, {
        source: "scheduleReportJob",
        userId,
        interviewId,
      });
    }
  });
}

export async function createInterviewAction(
  input: CreateInterviewFormInput,
): Promise<InterviewActionResult> {
  const parsed = createInterviewSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid interview setup",
    };
  }

  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: "You must be signed in" };
  }

  const supabase = await createClient();
  const sessions = new SessionService(supabase, { userId: user.id });
  let interviewId: string | null = null;

  try {
    const interview = await sessions.interviews.createSession(
      user.id,
      parsed.data,
    );
    interviewId = interview.id;

    const durationMinutes = resolveDurationMinutes(parsed.data);
    const limit = PromptBuilder.questionCountForDuration(durationMinutes);

    // Resume context ONLY in resume mode — standard interviews stay unchanged
    let resumeContext = null;
    if (parsed.data.resumeMode) {
      const provider = new ResumeProvider(supabase);
      const { resume } = await provider.getDashboard(user.id);
      if (!resume) {
        throw new Error(
          "Upload and analyze your resume before starting a resume-based interview",
        );
      }
      if (
        resume.analysis_status === "pending" ||
        resume.analysis_status === "processing"
      ) {
        throw new Error(
          "Resume analysis is still running. Please wait, then try again.",
        );
      }
      if (resume.analysis_status === "failed") {
        throw new Error(
          "Resume analysis failed. Retry analysis from the Resume page.",
        );
      }
      resumeContext = await provider.getInterviewContext(user.id);
      if (!resumeContext) {
        throw new Error(
          "Resume analysis is unavailable. Open Resume and retry analysis.",
        );
      }
    }

    // Single Gemini call at start — questions persisted to Supabase
    const drafts = await sessions.questions.fetchDrafts({
      interviewType: parsed.data.interviewType,
      roleTarget: parsed.data.roleTarget,
      experienceLevel: parsed.data.experienceLevel,
      difficulty: parsed.data.difficulty,
      durationMinutes,
      limit,
      resumeContext,
      resumeMode: Boolean(parsed.data.resumeMode),
      targetCompany: parsed.data.targetCompany,
    });

    if (drafts.length === 0) {
      throw new Error("Gemini did not return any questions");
    }

    await sessions.questions.materializeForInterview(interview.id, drafts);

    await sessions.logActivity(
      user.id,
      interview.id,
      parsed.data.resumeMode ? "resume_interview_started" : "interview_started",
      `Started ${interview.title}`,
    );

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/interviews");
    // Return session id — client navigates. Avoid redirect() which clients
    // often catch as a false "Could not start interview" error.
    return { success: true, sessionId: interview.id };
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    if (interviewId) {
      try {
        await sessions.interviews.deleteSession(interviewId, user.id);
      } catch {
        // Best-effort cleanup
      }
    }

    return { success: false, error: mapAiError(error) };
  }
}

export async function saveAnswerAction(input: {
  interviewId: string;
  questionId: string;
  content: string;
  isDraft?: boolean;
}): Promise<InterviewActionResult> {
  const parsed = saveAnswerInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid answer payload",
    };
  }

  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: "You must be signed in" };
  }

  const supabase = await createClient();
  const sessions = new SessionService(supabase, { userId: user.id });

  try {
    const interview = await sessions.interviews.getById(
      parsed.data.interviewId,
      user.id,
    );
    if (!interview) {
      return { success: false, error: "Interview not found" };
    }
    if (interview.status !== "in_progress") {
      return { success: false, error: "This interview is no longer active" };
    }
    if (sessions.interviews.isExpired(interview)) {
      await sessions.interviews.markAbandoned(interview.id, user.id);
      return { success: false, error: "This interview has expired" };
    }

    await sessions.answers.upsertAnswer({
      userId: user.id,
      interviewId: parsed.data.interviewId,
      questionId: parsed.data.questionId,
      content: parsed.data.content,
      isDraft: parsed.data.isDraft ?? true,
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: toSafeClientError(error, "Failed to save answer") };
  }
}

export async function syncInterviewProgressAction(input: {
  interviewId: string;
  currentQuestionIndex: number;
  elapsedSeconds: number;
}): Promise<InterviewActionResult> {
  const parsed = syncProgressInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid progress payload",
    };
  }

  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: "You must be signed in" };
  }

  const supabase = await createClient();
  const sessions = new SessionService(supabase, { userId: user.id });

  try {
    const interview = await sessions.interviews.getById(
      parsed.data.interviewId,
      user.id,
    );
    if (!interview || interview.status !== "in_progress") {
      return { success: false, error: "Interview is not active" };
    }

    await sessions.interviews.updateProgress(parsed.data.interviewId, user.id, {
      currentQuestionIndex: parsed.data.currentQuestionIndex,
      elapsedSeconds: parsed.data.elapsedSeconds,
      durationSeconds: parsed.data.elapsedSeconds,
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: toSafeClientError(error, "Failed to sync progress"),
    };
  }
}

export async function completeInterviewAction(input: {
  interviewId: string;
  elapsedSeconds: number;
}): Promise<InterviewActionResult> {
  const parsed = completeInterviewInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid completion payload",
    };
  }

  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: "You must be signed in" };
  }

  const supabase = await createClient();
  const sessions = new SessionService(supabase, { userId: user.id });

  try {
    const interview = await sessions.interviews.getById(
      parsed.data.interviewId,
      user.id,
    );
    if (!interview) {
      return { success: false, error: "Interview not found" };
    }

    if (interview.status !== "completed") {
      await sessions.interviews.complete(
        parsed.data.interviewId,
        user.id,
        parsed.data.elapsedSeconds,
      );

      await sessions.logActivity(
        user.id,
        parsed.data.interviewId,
        "interview_completed",
        "Finished interview session",
      );

      const profile = await getCurrentProfile();
      const baseEvent = {
        userName: profile?.full_name,
        userEmail: profile?.email ?? user.email ?? "",
        interviewType: interview.interview_type,
        targetCompany: interview.target_company,
      };
      void notifyAdminEvent({
        type: "interview_completed",
        ...baseEvent,
      });
      if (interview.target_company) {
        void notifyAdminEvent({
          type: "company_interview_completed",
          ...baseEvent,
        });
      }
      if (isResumeInterviewTitle(interview.title)) {
        // Voice completion is tracked when a dedicated flag exists; resume path notified here.
      }
    }

    const job = await sessions.reportGeneration.enqueue(
      user.id,
      parsed.data.interviewId,
    );

    // Background AI — does not block the response / redirect
    if (job.status !== "completed") {
      scheduleReportJob(user.id, parsed.data.interviewId);
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/interviews");
    revalidatePath(`/dashboard/interviews/${parsed.data.interviewId}`);
    revalidatePath("/dashboard/reports");
    revalidatePath(`/dashboard/reports/${parsed.data.interviewId}`);

    return {
      success: true,
      sessionId: parsed.data.interviewId,
      reportReady: job.status === "completed",
      reportStatus: job.status,
    };
  } catch (error) {
    return { success: false, error: mapAiError(error) };
  }
}

/** Lightweight poll endpoint for the processing UI. */
export async function getReportStatusAction(input: {
  interviewId: string;
}): Promise<InterviewActionResult> {
  const parsed = interviewIdInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid interview id",
    };
  }

  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: "You must be signed in" };
  }

  const supabase = await createClient();
  const status = await new ReportGenerationService(supabase).getStatus(
    parsed.data.interviewId,
    user.id,
  );

  return {
    success: true,
    sessionId: parsed.data.interviewId,
    reportReady: status.reportReady,
    reportStatus: status.status,
    error: status.errorMessage
      ? toSafeClientError(new Error(status.errorMessage))
      : undefined,
  };
}

/**
 * Processes the report job (or no-ops if another worker already claimed it).
 * Atomic claim prevents duplicate Gemini evaluation calls.
 */
export async function generateReportAction(input: {
  interviewId: string;
}): Promise<InterviewActionResult> {
  const parsed = interviewIdInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid interview id",
    };
  }

  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: "You must be signed in" };
  }

  const supabase = await createClient();
  const sessions = new SessionService(supabase, { userId: user.id });

  try {
    const interview = await sessions.interviews.getById(
      parsed.data.interviewId,
      user.id,
    );
    if (!interview) {
      return { success: false, error: "Interview not found" };
    }
    if (interview.status !== "completed") {
      return {
        success: false,
        error: "Finish the interview before generating a report",
      };
    }

    const current = await sessions.reportGeneration.getStatus(
      parsed.data.interviewId,
      user.id,
    );

    if (current.reportReady) {
      return {
        success: true,
        sessionId: parsed.data.interviewId,
        reportReady: true,
        reportStatus: "completed",
      };
    }

    // If already processing elsewhere, let the poller wait — do not double-call Gemini
    if (current.status === "processing") {
      return {
        success: true,
        sessionId: parsed.data.interviewId,
        reportReady: false,
        reportStatus: "processing",
      };
    }

    await sessions.reportGeneration.enqueue(user.id, parsed.data.interviewId);

    // Prefer background continuation when available; still process in-request
    // so serverless environments without durable after() still complete the job.
    scheduleReportJob(user.id, parsed.data.interviewId);
    const result = await sessions.reportGeneration.processJob(
      user.id,
      parsed.data.interviewId,
    );

    revalidatePath("/dashboard/reports");
    revalidatePath(`/dashboard/reports/${parsed.data.interviewId}`);
    revalidatePath(`/dashboard/interviews/${parsed.data.interviewId}`);

    return {
      success: result.status !== "failed",
      sessionId: parsed.data.interviewId,
      reportReady: result.reportReady,
      reportStatus: result.status,
      error: result.errorMessage
        ? toSafeClientError(new Error(result.errorMessage))
        : undefined,
    };
  } catch (error) {
    return { success: false, error: mapAiError(error) };
  }
}
