import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { AIServiceError } from "@/services/ai/ai-service";
import { ResumeAnalysisService } from "@/services/resumes/resume-analysis-service";
import { ResumeParser } from "@/services/resumes/resume-parser";
import {
  RESUME_MAX_BYTES,
  type GeminiResumeAnalysis,
  type ResumeContextSummary,
  type ResumeMimeType,
} from "@/services/resumes/schemas";
import { StorageService } from "@/services/resumes/storage-service";
import type {
  Database,
  Resume,
  ResumeAnalysis,
  ResumeAnalysisStatus,
} from "@/types/database";

type Client = SupabaseClient<Database>;

const STALE_PROCESSING_MS = 5 * 60 * 1000;

export type ResumeDashboardPayload = {
  resume: Resume | null;
  analysis: ResumeAnalysis | null;
  signedUrl: string | null;
};

/**
 * Owns resume CRUD, storage, and async analysis lifecycle.
 */
export class ResumeService {
  private readonly storage: StorageService;
  private readonly analysisService: ResumeAnalysisService;

  constructor(private readonly supabase: Client) {
    this.storage = new StorageService(supabase);
    this.analysisService = new ResumeAnalysisService();
  }

  async getForUser(userId: string): Promise<Resume | null> {
    const { data, error } = await this.supabase
      .from("resumes")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async getAnalysisForResume(
    resumeId: string,
    userId: string,
  ): Promise<ResumeAnalysis | null> {
    const { data, error } = await this.supabase
      .from("resume_analysis")
      .select("*")
      .eq("resume_id", resumeId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async getCompletedContext(
    userId: string,
  ): Promise<ResumeContextSummary | null> {
    const resume = await this.getForUser(userId);
    if (!resume || resume.analysis_status !== "completed") {
      return null;
    }

    const analysis = await this.getAnalysisForResume(resume.id, userId);
    if (!analysis) {
      return null;
    }

    return ResumeAnalysisService.toContextSummary(analysis);
  }

  async getDashboardPayload(userId: string): Promise<ResumeDashboardPayload> {
    const resume = await this.getForUser(userId);
    if (!resume) {
      return { resume: null, analysis: null, signedUrl: null };
    }

    const [analysis, signedUrl] = await Promise.all([
      this.getAnalysisForResume(resume.id, userId),
      this.storage.createSignedUrl(resume.file_path).catch(() => null),
    ]);

    return { resume, analysis, signedUrl };
  }

  async createSignedUrl(userId: string): Promise<string> {
    const resume = await this.getForUser(userId);
    if (!resume) {
      throw new Error("No resume found");
    }
    return this.storage.createSignedUrl(resume.file_path);
  }

  validateFile(file: File): { mimeType: ResumeMimeType } {
    if (!ResumeParser.isSupportedMime(file.type)) {
      throw new Error("Only PDF and DOCX resumes are supported");
    }
    if (file.size <= 0 || file.size > RESUME_MAX_BYTES) {
      throw new Error("Resume must be under 5 MB");
    }
    return { mimeType: file.type };
  }

  async uploadOrReplace(userId: string, file: File): Promise<Resume> {
    const { mimeType } = this.validateFile(file);
    const bytes = await file.arrayBuffer();
    const existing = await this.getForUser(userId);

    const filePath = await this.storage.uploadResume({
      userId,
      fileName: file.name,
      mimeType,
      bytes,
    });

    if (existing) {
      await this.storage.remove(existing.file_path).catch(() => undefined);
      await this.supabase
        .from("resume_analysis")
        .delete()
        .eq("resume_id", existing.id)
        .eq("user_id", userId);

      const { data, error } = await this.supabase
        .from("resumes")
        .update({
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: mimeType,
          uploaded_at: new Date().toISOString(),
          analysis_status: "pending",
          error_message: null,
          extracted_text: null,
        })
        .eq("id", existing.id)
        .eq("user_id", userId)
        .select("*")
        .single();

      if (error || !data) {
        await this.storage.remove(filePath).catch(() => undefined);
        throw new Error(error?.message ?? "Failed to replace resume");
      }

      return data;
    }

    const { data, error } = await this.supabase
      .from("resumes")
      .insert({
        user_id: userId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: mimeType,
        analysis_status: "pending",
      })
      .select("*")
      .single();

    if (error || !data) {
      await this.storage.remove(filePath).catch(() => undefined);
      throw new Error(error?.message ?? "Failed to save resume");
    }

    return data;
  }

  async deleteForUser(userId: string): Promise<void> {
    const resume = await this.getForUser(userId);
    if (!resume) {
      return;
    }

    await this.storage.remove(resume.file_path).catch(() => undefined);

    const { error } = await this.supabase
      .from("resumes")
      .delete()
      .eq("id", resume.id)
      .eq("user_id", userId);

    if (error) {
      throw new Error(error.message);
    }
  }

  async markPendingForRetry(userId: string): Promise<Resume> {
    const resume = await this.getForUser(userId);
    if (!resume) {
      throw new Error("No resume found");
    }

    const { data, error } = await this.supabase
      .from("resumes")
      .update({
        analysis_status: "pending",
        error_message: null,
      })
      .eq("id", resume.id)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to queue resume analysis");
    }

    return data;
  }

  async getStatus(userId: string): Promise<{
    status: ResumeAnalysisStatus | "none";
    errorMessage: string | null;
    ready: boolean;
  }> {
    const resume = await this.getForUser(userId);
    if (!resume) {
      return { status: "none", errorMessage: null, ready: false };
    }

    return {
      status: resume.analysis_status,
      errorMessage: resume.error_message,
      ready: resume.analysis_status === "completed",
    };
  }

  private async tryClaim(userId: string): Promise<Resume | null> {
    const resume = await this.getForUser(userId);
    if (!resume) {
      return null;
    }

    const stale =
      resume.analysis_status === "processing" &&
      Date.now() - new Date(resume.updated_at).getTime() > STALE_PROCESSING_MS;

    if (
      resume.analysis_status !== "pending" &&
      !(resume.analysis_status === "failed") &&
      !stale
    ) {
      return null;
    }

    const { data, error } = await this.supabase
      .from("resumes")
      .update({
        analysis_status: "processing",
        error_message: null,
      })
      .eq("id", resume.id)
      .eq("user_id", userId)
      .in("analysis_status", stale ? ["pending", "failed", "processing"] : ["pending", "failed"])
      .select("*")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async processAnalysis(userId: string): Promise<{
    status: ResumeAnalysisStatus | "none";
    errorMessage: string | null;
    ready: boolean;
  }> {
    const claimed = await this.tryClaim(userId);
    if (!claimed) {
      return this.getStatus(userId);
    }

    try {
      const blob = await this.storage.download(claimed.file_path);
      const buffer = Buffer.from(await blob.arrayBuffer());

      if (!ResumeParser.isSupportedMime(claimed.mime_type)) {
        throw new Error("Unsupported resume file type");
      }

      const extractedText = await ResumeParser.extractText(
        buffer,
        claimed.mime_type,
      );

      if (extractedText.length < 40) {
        throw new Error(
          "Could not extract enough text from this resume. Try a text-based PDF or DOCX.",
        );
      }

      const analysis = await this.analysisService.analyzeText({
        userId,
        extractedText,
      });

      await this.persistAnalysis(claimed, extractedText, analysis);

      return {
        status: "completed",
        errorMessage: null,
        ready: true,
      };
    } catch (error) {
      const message =
        error instanceof AIServiceError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Resume analysis failed";

      await this.supabase
        .from("resumes")
        .update({
          analysis_status: "failed",
          error_message: message.slice(0, 500),
        })
        .eq("id", claimed.id)
        .eq("user_id", userId);

      return {
        status: "failed",
        errorMessage: message,
        ready: false,
      };
    }
  }

  private async persistAnalysis(
    resume: Resume,
    extractedText: string,
    analysis: GeminiResumeAnalysis,
  ): Promise<void> {
    const row = {
      resume_id: resume.id,
      user_id: resume.user_id,
      personal_summary: analysis.personalSummary,
      skills: analysis.skills,
      programming_languages: analysis.programmingLanguages,
      frameworks: analysis.frameworks,
      libraries: analysis.libraries,
      databases: analysis.databases,
      cloud_platforms: analysis.cloudPlatforms,
      tools: analysis.tools,
      projects: analysis.projects,
      work_experience: analysis.workExperience,
      education: analysis.education,
      certifications: analysis.certifications,
      soft_skills: analysis.softSkills,
      years_of_experience: analysis.yearsOfExperience,
      career_level: analysis.careerLevel,
      health_score: analysis.healthScore,
      suggestions: analysis.suggestions,
      raw_json: analysis as unknown as Record<string, unknown>,
    };

    const { error: analysisError } = await this.supabase
      .from("resume_analysis")
      .upsert(row, { onConflict: "resume_id" });

    if (analysisError) {
      throw new Error(analysisError.message);
    }

    const { error: resumeError } = await this.supabase
      .from("resumes")
      .update({
        analysis_status: "completed",
        error_message: null,
        extracted_text: extractedText.slice(0, 60000),
      })
      .eq("id", resume.id)
      .eq("user_id", resume.user_id);

    if (resumeError) {
      throw new Error(resumeError.message);
    }
  }
}
