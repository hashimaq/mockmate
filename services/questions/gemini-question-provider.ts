import "server-only";

import { getAIService } from "@/services/ai/ai-service";
import { PromptBuilder } from "@/services/ai/prompt-builder";
import { geminiQuestionsSchema } from "@/services/ai/schemas";
import type {
  QuestionDraft,
  QuestionProvider,
  QuestionQuery,
} from "@/services/questions/types";

export class GeminiQuestionProvider implements QuestionProvider {
  constructor(private readonly rateLimitKey: string = "anonymous") {}

  async getQuestions(query: QuestionQuery): Promise<QuestionDraft[]> {
    const count =
      query.limit ??
      PromptBuilder.questionCountForDuration(query.durationMinutes ?? 20);

    const prompt = PromptBuilder.buildQuestionPrompt({
      ...query,
      limit: count,
    });

    const ai = getAIService();
    const payload = await ai.generateJson({
      system: prompt.system,
      user: prompt.user,
      schema: geminiQuestionsSchema,
      rateLimitKey: `questions:${this.rateLimitKey}`,
      temperature: 0.45,
      maxOutputTokens: 1024,
    });

    return payload.questions.slice(0, count).map((item, index) => ({
      prompt: item.prompt,
      category: item.category ?? null,
      order_index: index,
    }));
  }
}
