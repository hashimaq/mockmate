import type { ResumeContextSummary } from "@/services/resumes/schemas";
import type {
  ExperienceLevel,
  InterviewDifficulty,
  InterviewType,
} from "@/types/database";

export type QuestionDraft = {
  prompt: string;
  category: string | null;
  order_index: number;
};

export type QuestionQuery = {
  interviewType: InterviewType;
  roleTarget: string;
  experienceLevel: ExperienceLevel;
  difficulty: InterviewDifficulty;
  durationMinutes?: number;
  limit?: number;
  /** Present only for resume-mode interviews with completed analysis. */
  resumeContext?: ResumeContextSummary | null;
  resumeMode?: boolean;
  /** Optional target company display name for company-specific interviews. */
  targetCompany?: string | null;
};

/**
 * Provider interface — Gemini today, seed/offline providers for tests/fallback.
 * Interview UI never depends on a concrete provider.
 */
export interface QuestionProvider {
  getQuestions(query: QuestionQuery): Promise<QuestionDraft[]>;
}
