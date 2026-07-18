import "server-only";

import { getAIService } from "@/services/ai/ai-service";
import { PromptBuilder } from "@/services/ai/prompt-builder";
import {
  geminiEvaluationSchema,
  type CompanyInsights,
  type GeminiEvaluationPayload,
  type ReportMetadata,
  type ResumeInsights,
} from "@/services/ai/schemas";
import type { ResumeContextSummary } from "@/services/resumes/schemas";
import type { Answer, Interview, Question } from "@/types/database";

export type InterviewEvaluationInput = {
  interview: Interview;
  questions: Question[];
  answers: Answer[];
  rateLimitKey: string;
  resumeContext?: ResumeContextSummary | null;
};

export type InterviewEvaluationResult = {
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  strengths: string[];
  weaknesses: string[];
  improvementPlan: string[];
  summary: string;
  questionFeedback: ReportMetadata["questionFeedback"];
  model: string;
  resumeInsights?: ResumeInsights;
  companyInsights?: CompanyInsights;
};

export interface InterviewEvaluationProvider {
  evaluateInterview(
    input: InterviewEvaluationInput,
  ): Promise<InterviewEvaluationResult>;
}

function mapFeedback(
  payload: GeminiEvaluationPayload,
  questions: Question[],
  answers: Answer[],
): ReportMetadata["questionFeedback"] {
  const answerByQuestion = new Map(
    answers.map((answer) => [answer.question_id, answer.content]),
  );

  return questions.map((question, index) => {
    const item =
      payload.questionFeedback.find((entry) => entry.questionIndex === index) ??
      payload.questionFeedback[index];

    return {
      questionId: question.id,
      questionPrompt: question.prompt,
      answerContent: answerByQuestion.get(question.id) ?? "",
      score: item?.score ?? payload.overallScore,
      feedback:
        item?.feedback ??
        "No specific feedback was generated for this question.",
      betterAnswer:
        item?.betterAnswer ??
        "Provide a structured answer with context, action, and result.",
    };
  });
}

export class GeminiEvaluationProvider implements InterviewEvaluationProvider {
  async evaluateInterview(
    input: InterviewEvaluationInput,
  ): Promise<InterviewEvaluationResult> {
    if (input.questions.length === 0) {
      throw new Error("Cannot evaluate an interview with no questions");
    }

    const prompt = PromptBuilder.buildEvaluationPrompt({
      interview: input.interview,
      questions: input.questions,
      answers: input.answers,
      resumeContext: input.resumeContext,
    });

    const ai = getAIService();
    const payload = await ai.generateJson({
      system: prompt.system,
      user: prompt.user,
      schema: geminiEvaluationSchema,
      rateLimitKey: `evaluation:${input.rateLimitKey}`,
      temperature: 0.3,
      // Enough room for strengths, weaknesses, plan, and per-question coaching
      maxOutputTokens: Math.min(
        8192,
        2400 +
          input.questions.length * 700 +
          (input.resumeContext ? 900 : 0) +
          (input.interview.target_company ? 700 : 0),
      ),
    });

    return {
      overallScore: payload.overallScore,
      technicalScore: payload.technicalScore,
      communicationScore: payload.communicationScore,
      problemSolvingScore: payload.problemSolvingScore,
      strengths: payload.strengths,
      weaknesses: payload.weaknesses,
      improvementPlan: payload.improvementPlan,
      summary: payload.summary,
      questionFeedback: mapFeedback(
        payload,
        input.questions,
        input.answers,
      ),
      model: ai.modelName,
      resumeInsights: payload.resumeInsights,
      companyInsights: payload.companyInsights,
    };
  }
}

export class EvaluationService {
  constructor(
    private readonly provider: InterviewEvaluationProvider = new GeminiEvaluationProvider(),
  ) {}

  async evaluateInterview(
    input: InterviewEvaluationInput,
  ): Promise<InterviewEvaluationResult> {
    return this.provider.evaluateInterview(input);
  }
}
