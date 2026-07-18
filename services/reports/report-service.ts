import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { InterviewEvaluationResult } from "@/services/evaluation/evaluation-service";
import type { ReportMetadata } from "@/services/ai/schemas";
import type { Database, Report, ReportStatus } from "@/types/database";

type Client = SupabaseClient<Database>;

/** Allow reclaim if a worker dies mid-job. */
const STALE_PROCESSING_MS = 3 * 60 * 1000;

export class ReportService {
  constructor(private readonly supabase: Client) {}

  async getByInterviewId(
    interviewId: string,
    userId: string,
  ): Promise<Report | null> {
    const { data, error } = await this.supabase
      .from("reports")
      .select("*")
      .eq("interview_id", interviewId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async listForUser(userId: string, limit = 20): Promise<Report[]> {
    const { data, error } = await this.supabase
      .from("reports")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  }

  async listCompletedForUser(userId: string, limit = 20): Promise<Report[]> {
    const { data, error } = await this.supabase
      .from("reports")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  }

  /**
   * Creates a pending report job without calling AI.
   * Idempotent for completed / already-running jobs.
   */
  async ensurePendingJob(userId: string, interviewId: string): Promise<Report> {
    const existing = await this.getByInterviewId(interviewId, userId);

    if (existing?.status === "completed") {
      return existing;
    }

    if (
      existing?.status === "processing" &&
      !this.isStaleProcessing(existing)
    ) {
      return existing;
    }

    if (existing) {
      const { data, error } = await this.supabase
        .from("reports")
        .update({
          status: "pending" satisfies ReportStatus,
          error_message: null,
          started_at: null,
          completed_at: null,
        })
        .eq("id", existing.id)
        .eq("user_id", userId)
        .select("*")
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    }

    const { data, error } = await this.supabase
      .from("reports")
      .insert({
        interview_id: interviewId,
        user_id: userId,
        status: "pending",
        overall_score: null,
        summary: null,
        strengths: [],
        improvements: [],
        metadata: {},
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Atomically claim a job for processing.
   * Returns null if another worker owns it or it is already completed.
   */
  async tryClaimJob(
    interviewId: string,
    userId: string,
  ): Promise<Report | null> {
    const existing = await this.getByInterviewId(interviewId, userId);

    if (!existing) {
      await this.ensurePendingJob(userId, interviewId);
    } else if (existing.status === "completed") {
      return null;
    } else if (
      existing.status === "processing" &&
      !this.isStaleProcessing(existing)
    ) {
      return null;
    }

    const now = new Date().toISOString();
    const claimable: ReportStatus[] = ["pending", "failed"];
    if (existing && this.isStaleProcessing(existing)) {
      claimable.push("processing");
    }

    const { data, error } = await this.supabase
      .from("reports")
      .update({
        status: "processing",
        error_message: null,
        started_at: now,
        completed_at: null,
      })
      .eq("interview_id", interviewId)
      .eq("user_id", userId)
      .in("status", claimable)
      .select("*")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async markFailed(
    interviewId: string,
    userId: string,
    message: string,
  ): Promise<void> {
    const { error } = await this.supabase
      .from("reports")
      .update({
        status: "failed",
        error_message: message.slice(0, 500),
        completed_at: new Date().toISOString(),
      })
      .eq("interview_id", interviewId)
      .eq("user_id", userId);

    if (error) {
      throw new Error(error.message);
    }
  }

  async saveEvaluation(input: {
    userId: string;
    interviewId: string;
    evaluation: InterviewEvaluationResult;
  }): Promise<Report> {
    const metadata: ReportMetadata = {
      technicalScore: input.evaluation.technicalScore,
      communicationScore: input.evaluation.communicationScore,
      problemSolvingScore: input.evaluation.problemSolvingScore,
      weaknesses: input.evaluation.weaknesses,
      improvementPlan: input.evaluation.improvementPlan,
      questionFeedback: input.evaluation.questionFeedback,
      model: input.evaluation.model,
      generatedAt: new Date().toISOString(),
      ...(input.evaluation.resumeInsights
        ? { resumeInsights: input.evaluation.resumeInsights }
        : {}),
      ...(input.evaluation.companyInsights
        ? { companyInsights: input.evaluation.companyInsights }
        : {}),
    };

    const { data, error } = await this.supabase
      .from("reports")
      .upsert(
        {
          interview_id: input.interviewId,
          user_id: input.userId,
          overall_score: input.evaluation.overallScore,
          summary: input.evaluation.summary,
          strengths: input.evaluation.strengths,
          improvements: input.evaluation.weaknesses,
          metadata: metadata as unknown as Record<string, unknown>,
          status: "completed",
          error_message: null,
          completed_at: new Date().toISOString(),
        },
        { onConflict: "interview_id" },
      )
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  isStaleProcessing(report: Report): boolean {
    if (report.status !== "processing" || !report.started_at) {
      return false;
    }
    return (
      Date.now() - new Date(report.started_at).getTime() > STALE_PROCESSING_MS
    );
  }
}

export function parseReportMetadata(
  metadata: Record<string, unknown> | null | undefined,
): ReportMetadata | null {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const technicalScore = metadata.technicalScore;
  const communicationScore = metadata.communicationScore;
  const problemSolvingScore = metadata.problemSolvingScore;
  const weaknesses = metadata.weaknesses;
  const improvementPlan = metadata.improvementPlan;
  const questionFeedback = metadata.questionFeedback;

  if (
    typeof technicalScore !== "number" ||
    typeof communicationScore !== "number" ||
    typeof problemSolvingScore !== "number"
  ) {
    return null;
  }

  const resumeInsightsRaw = metadata.resumeInsights;
  const resumeInsights =
    resumeInsightsRaw &&
    typeof resumeInsightsRaw === "object" &&
    !Array.isArray(resumeInsightsRaw)
      ? (resumeInsightsRaw as ReportMetadata["resumeInsights"])
      : undefined;

  const companyInsightsRaw = metadata.companyInsights;
  const companyInsights =
    companyInsightsRaw &&
    typeof companyInsightsRaw === "object" &&
    !Array.isArray(companyInsightsRaw)
      ? (companyInsightsRaw as ReportMetadata["companyInsights"])
      : undefined;

  return {
    technicalScore,
    communicationScore,
    problemSolvingScore,
    weaknesses: Array.isArray(weaknesses)
      ? weaknesses.filter((item): item is string => typeof item === "string")
      : [],
    improvementPlan: Array.isArray(improvementPlan)
      ? improvementPlan.filter((item): item is string => typeof item === "string")
      : [],
    questionFeedback: Array.isArray(questionFeedback)
      ? (questionFeedback as ReportMetadata["questionFeedback"])
      : [],
    model: typeof metadata.model === "string" ? metadata.model : "unknown",
    generatedAt:
      typeof metadata.generatedAt === "string"
        ? metadata.generatedAt
        : new Date().toISOString(),
    ...(resumeInsights ? { resumeInsights } : {}),
    ...(companyInsights ? { companyInsights } : {}),
  };
}

/** Completed jobs, or legacy reports created before status column existed. */
export function isReportReady(report: Report | null): boolean {
  if (!report) return false;

  if (
    report.status === "pending" ||
    report.status === "processing" ||
    report.status === "failed"
  ) {
    return false;
  }

  // status === "completed" OR legacy/missing status with saved content
  return (
    report.status === "completed" ||
    report.overall_score !== null ||
    Boolean(report.summary) ||
    report.strengths.length > 0
  );
}
