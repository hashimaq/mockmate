import "server-only";

import { z } from "zod";

const scoreSchema = z.number().min(0).max(100);

export const geminiQuestionsSchema = z.object({
  questions: z
    .array(
      z.object({
        prompt: z.string().trim().min(10).max(2000),
        category: z.string().trim().min(2).max(80).nullable().optional(),
      }),
    )
    .min(1)
    .max(12),
});

export type GeminiQuestionsPayload = z.infer<typeof geminiQuestionsSchema>;

const stringInsightList = z
  .array(z.string().trim().min(3).max(400))
  .min(1)
  .max(8);

export const resumeInsightsSchema = z.object({
  strongAlignment: stringInsightList,
  knowledgeGaps: stringInsightList,
  resumeClaimsNeedingImprovement: stringInsightList,
  missingExplanations: stringInsightList,
  personalizedRecommendations: stringInsightList,
  skillsDemonstratedSuccessfully: stringInsightList.optional(),
  topicsAnsweredWeakly: stringInsightList.optional(),
  skillsRequiringImprovement: stringInsightList.optional(),
  resumeCredibilityScore: z.number().min(0).max(100).optional(),
  suggestedLearningPath: stringInsightList.optional(),
});

export type ResumeInsights = z.infer<typeof resumeInsightsSchema>;

export const companyInsightsSchema = z.object({
  companyReadinessScore: scoreSchema,
  hiringStyleMatch: stringInsightList,
  behavioralReadiness: scoreSchema,
  technicalReadiness: scoreSchema,
  recommendedImprovements: stringInsightList,
  suggestedNextInterview: z.string().trim().min(10).max(500),
});

export type CompanyInsights = z.infer<typeof companyInsightsSchema>;

export const geminiEvaluationSchema = z.object({
  overallScore: scoreSchema,
  technicalScore: scoreSchema,
  communicationScore: scoreSchema,
  problemSolvingScore: scoreSchema,
  strengths: z.array(z.string().trim().min(3).max(400)).min(2).max(8),
  weaknesses: z.array(z.string().trim().min(3).max(400)).min(2).max(8),
  improvementPlan: z.array(z.string().trim().min(3).max(500)).min(2).max(8),
  summary: z.string().trim().min(40).max(2000),
  questionFeedback: z
    .array(
      z.object({
        questionIndex: z.number().int().min(0).max(20),
        score: scoreSchema,
        feedback: z.string().trim().min(10).max(1000),
        betterAnswer: z.string().trim().min(20).max(2000),
      }),
    )
    .min(1)
    .max(12),
  resumeInsights: resumeInsightsSchema.optional(),
  companyInsights: companyInsightsSchema.optional(),
});

export type GeminiEvaluationPayload = z.infer<typeof geminiEvaluationSchema>;

export type ReportMetadata = {
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  weaknesses: string[];
  improvementPlan: string[];
  questionFeedback: Array<{
    questionId: string;
    questionPrompt: string;
    answerContent: string;
    score: number;
    feedback: string;
    betterAnswer: string;
  }>;
  model: string;
  generatedAt: string;
  resumeInsights?: ResumeInsights;
  companyInsights?: CompanyInsights;
};
