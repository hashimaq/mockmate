import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { AnswerService } from "@/services/answers/answer-service";
import { AIServiceError } from "@/services/ai/ai-service";
import { EvaluationService } from "@/services/evaluation/evaluation-service";
import { InterviewService } from "@/services/interviews/interview-service";
import { NotificationService } from "@/services/notifications/notification-service";
import { QuestionService } from "@/services/questions/question-service";
import { isResumeInterviewTitle } from "@/features/resumes/lib/resume-interview-gate";
import { notifyAdminEvent } from "@/services/notifications/admin-email-service";
import { ResumeProvider } from "@/services/resumes/resume-provider";
import { ReportService } from "@/services/reports/report-service";
import type { Database, Report, ReportStatus } from "@/types/database";

type Client = SupabaseClient<Database>;

export type ReportJobStatusResult = {
  status: ReportStatus | "none";
  errorMessage: string | null;
  reportReady: boolean;
};

/**
 * Owns async report lifecycle: claim → evaluate → persist.
 * UI never talks to Gemini — only this service (via server actions).
 */
export class ReportGenerationService {
  private readonly interviews: InterviewService;
  private readonly questions: QuestionService;
  private readonly answers: AnswerService;
  private readonly reports: ReportService;
  private readonly evaluation: EvaluationService;
  private readonly notifications: NotificationService;
  private readonly resumes: ResumeProvider;

  constructor(private readonly supabase: Client) {
    this.interviews = new InterviewService(supabase);
    this.questions = new QuestionService(supabase);
    this.answers = new AnswerService(supabase);
    this.reports = new ReportService(supabase);
    this.evaluation = new EvaluationService();
    this.notifications = new NotificationService(supabase);
    this.resumes = new ResumeProvider(supabase);
  }

  async getStatus(
    interviewId: string,
    userId: string,
  ): Promise<ReportJobStatusResult> {
    const report = await this.reports.getByInterviewId(interviewId, userId);
    if (!report) {
      return { status: "none", errorMessage: null, reportReady: false };
    }

    return {
      status: report.status,
      errorMessage: report.error_message,
      reportReady: report.status === "completed",
    };
  }

  async enqueue(userId: string, interviewId: string): Promise<Report> {
    return this.reports.ensurePendingJob(userId, interviewId);
  }

  /**
   * Runs AI evaluation if this worker successfully claims the job.
   * Safe to call concurrently — duplicates are no-ops.
   */
  async processJob(
    userId: string,
    interviewId: string,
  ): Promise<ReportJobStatusResult> {
    const interview = await this.interviews.getById(interviewId, userId);
    if (!interview) {
      return {
        status: "failed",
        errorMessage: "Interview not found",
        reportReady: false,
      };
    }

    if (interview.status !== "completed") {
      return {
        status: "failed",
        errorMessage: "Interview is not completed",
        reportReady: false,
      };
    }

    const claimed = await this.reports.tryClaimJob(interviewId, userId);
    if (!claimed) {
      return this.getStatus(interviewId, userId);
    }

    await this.notifications.notify({
      userId,
      interviewId,
      action: "report_processing",
      description: "AI report generation started",
    });

    try {
      const [questions, answers] = await Promise.all([
        this.questions.listForInterview(interviewId),
        this.answers.listForInterview(interviewId),
      ]);

      // Resume alignment only for resume-mode interviews (title marker)
      const resumeContext = isResumeInterviewTitle(interview.title)
        ? await this.resumes.getInterviewContext(userId)
        : null;

      // Questions come only from Supabase — never regenerate during eval
      const evaluation = await this.evaluation.evaluateInterview({
        interview,
        questions,
        answers,
        rateLimitKey: userId,
        resumeContext,
      });

      const report = await this.reports.saveEvaluation({
        userId,
        interviewId,
        evaluation,
      });

      await this.interviews.setScore(interviewId, userId, evaluation.overallScore);

      await this.answers.applyEvaluationFeedback(
        evaluation.questionFeedback.map((item) => ({
          questionId: item.questionId,
          score: item.score,
          feedback: item.feedback,
        })),
      );

      await this.notifications.notify({
        userId,
        interviewId,
        action: "report_generated",
        description: "AI evaluation report ready",
        metadata: { overallScore: evaluation.overallScore },
      });

      const { data: profile } = await this.supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", userId)
        .maybeSingle();

      void notifyAdminEvent({
        type: "ai_report_generated",
        userName: profile?.full_name,
        userEmail: profile?.email ?? userId,
        interviewType: interview.interview_type,
        targetCompany: interview.target_company,
        overallScore: evaluation.overallScore,
        details: `Interview ${interviewId}`,
      });

      return {
        status: report.status,
        errorMessage: null,
        reportReady: true,
      };
    } catch (error) {
      const message =
        error instanceof AIServiceError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Report generation failed";

      await this.reports.markFailed(interviewId, userId, message);

      await this.notifications.notify({
        userId,
        interviewId,
        action: "report_failed",
        description: message,
      });

      const { data: profile } = await this.supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", userId)
        .maybeSingle();

      void notifyAdminEvent({
        type: "critical_ai_error",
        userName: profile?.full_name,
        userEmail: profile?.email ?? userId,
        interviewType: interview.interview_type,
        targetCompany: interview.target_company,
        details: message,
      });

      return {
        status: "failed",
        errorMessage: message,
        reportReady: false,
      };
    }
  }
}
