import type { SupabaseClient } from "@supabase/supabase-js";

import { AnswerService } from "@/services/answers/answer-service";
import { EvaluationService } from "@/services/evaluation/evaluation-service";
import { InterviewService } from "@/services/interviews/interview-service";
import { NotificationService } from "@/services/notifications/notification-service";
import { GeminiQuestionProvider } from "@/services/questions/gemini-question-provider";
import { QuestionService } from "@/services/questions/question-service";
import { ReportGenerationService } from "@/services/reports/report-generation-service";
import { ReportService, isReportReady } from "@/services/reports/report-service";
import type {
  Answer,
  Database,
  Interview,
  Question,
  Report,
} from "@/types/database";

type Client = SupabaseClient<Database>;

export type InterviewSessionPayload = {
  interview: Interview;
  questions: Question[];
  answers: Answer[];
  report: Report | null;
  isExpired: boolean;
  isFinished: boolean;
  hasReport: boolean;
};

/**
 * Orchestrates interview session lifecycle.
 * UI depends on this facade — never on Gemini directly.
 */
export class SessionService {
  readonly interviews: InterviewService;
  readonly questions: QuestionService;
  readonly answers: AnswerService;
  readonly reports: ReportService;
  readonly reportGeneration: ReportGenerationService;
  readonly evaluation: EvaluationService;
  readonly notifications: NotificationService;

  constructor(
    private readonly supabase: Client,
    options?: { userId?: string },
  ) {
    this.interviews = new InterviewService(supabase);
    // Gemini only used when QuestionService.fetchDrafts is called (start once)
    this.questions = new QuestionService(
      supabase,
      new GeminiQuestionProvider(options?.userId ?? "anonymous"),
    );
    this.answers = new AnswerService(supabase);
    this.reports = new ReportService(supabase);
    this.reportGeneration = new ReportGenerationService(supabase);
    this.evaluation = new EvaluationService();
    this.notifications = new NotificationService(supabase);
  }

  async getSession(
    interviewId: string,
    userId: string,
  ): Promise<InterviewSessionPayload | null> {
    const interview = await this.interviews.getById(interviewId, userId);
    if (!interview) return null;

    const [questions, answers, report] = await Promise.all([
      this.questions.listForInterview(interviewId),
      this.answers.listForInterview(interviewId),
      this.reports.getByInterviewId(interviewId, userId),
    ]);

    const isExpired = this.interviews.isExpired(interview);
    if (isExpired && interview.status === "in_progress") {
      await this.interviews.markAbandoned(interviewId, userId);
      interview.status = "abandoned";
    }

    return {
      interview,
      questions,
      answers,
      report,
      isExpired,
      isFinished:
        interview.status === "completed" || interview.status === "abandoned",
      hasReport: isReportReady(report),
    };
  }

  async logActivity(
    userId: string,
    interviewId: string,
    action: string,
    description: string,
  ) {
    await this.notifications.notify({
      userId,
      interviewId,
      action,
      description,
    });
  }
}
