import type { SupabaseClient } from "@supabase/supabase-js";

import { GeminiQuestionProvider } from "@/services/questions/gemini-question-provider";
import type { QuestionDraft, QuestionProvider, QuestionQuery } from "@/services/questions/types";
import type { Database, Question } from "@/types/database";

type Client = SupabaseClient<Database>;

export class QuestionService {
  private readonly provider: QuestionProvider;

  constructor(
    private readonly supabase: Client,
    provider?: QuestionProvider,
  ) {
    this.provider = provider ?? new GeminiQuestionProvider();
  }

  async fetchDrafts(query: QuestionQuery): Promise<QuestionDraft[]> {
    return this.provider.getQuestions(query);
  }

  async materializeForInterview(
    interviewId: string,
    drafts: QuestionDraft[],
  ): Promise<Question[]> {
    if (drafts.length === 0) {
      return [];
    }

    const payload = drafts.map((draft, index) => ({
      interview_id: interviewId,
      prompt: draft.prompt,
      category: draft.category,
      order_index: draft.order_index ?? index,
    }));

    const { data, error } = await this.supabase
      .from("questions")
      .insert(payload)
      .select("*")
      .order("order_index", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  }

  async listForInterview(interviewId: string): Promise<Question[]> {
    const { data, error } = await this.supabase
      .from("questions")
      .select("*")
      .eq("interview_id", interviewId)
      .order("order_index", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  }
}
