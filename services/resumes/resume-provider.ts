import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { ResumeAnalysisService } from "@/services/resumes/resume-analysis-service";
import {
  ResumeService,
  type ResumeDashboardPayload,
} from "@/services/resumes/resume-service";
import type { ResumeContextSummary } from "@/services/resumes/schemas";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

/**
 * Facade for resume features used by server actions and interview/report flows.
 * UI never talks to storage or Gemini directly.
 */
export class ResumeProvider {
  private readonly resumes: ResumeService;

  constructor(supabase: Client) {
    this.resumes = new ResumeService(supabase);
  }

  get service(): ResumeService {
    return this.resumes;
  }

  async getDashboard(userId: string): Promise<ResumeDashboardPayload> {
    return this.resumes.getDashboardPayload(userId);
  }

  async getInterviewContext(
    userId: string,
  ): Promise<ResumeContextSummary | null> {
    return this.resumes.getCompletedContext(userId);
  }

  formatContextForPrompt(context: ResumeContextSummary): string {
    return ResumeAnalysisService.formatContextForPrompt(context);
  }
}
