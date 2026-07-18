import type { SupabaseClient } from "@supabase/supabase-js";

import type { Answer, Database } from "@/types/database";

type Client = SupabaseClient<Database>;

export class AnswerService {
  constructor(private readonly supabase: Client) {}

  async listForInterview(interviewId: string): Promise<Answer[]> {
    const { data, error } = await this.supabase
      .from("answers")
      .select("*")
      .eq("interview_id", interviewId);

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  }

  async upsertAnswer(input: {
    userId: string;
    interviewId: string;
    questionId: string;
    content: string;
    isDraft?: boolean;
  }): Promise<Answer> {
    await this.assertOwnership(
      input.userId,
      input.interviewId,
      input.questionId,
    );

    const now = new Date().toISOString();
    const isDraft = input.isDraft ?? true;

    const { data, error } = await this.supabase
      .from("answers")
      .upsert(
        {
          user_id: input.userId,
          interview_id: input.interviewId,
          question_id: input.questionId,
          content: input.content,
          is_draft: isDraft,
          saved_at: isDraft ? null : now,
        },
        { onConflict: "question_id" },
      )
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  /** Defense in depth alongside RLS — question must belong to the user's interview. */
  private async assertOwnership(
    userId: string,
    interviewId: string,
    questionId: string,
  ): Promise<void> {
    const { data: interview, error: interviewError } = await this.supabase
      .from("interviews")
      .select("id")
      .eq("id", interviewId)
      .eq("user_id", userId)
      .maybeSingle();

    if (interviewError) {
      throw new Error(interviewError.message);
    }
    if (!interview) {
      throw new Error("Interview not found");
    }

    const { data: question, error: questionError } = await this.supabase
      .from("questions")
      .select("id")
      .eq("id", questionId)
      .eq("interview_id", interviewId)
      .maybeSingle();

    if (questionError) {
      throw new Error(questionError.message);
    }
    if (!question) {
      throw new Error("Question not found for this interview");
    }
  }

  async applyEvaluationFeedback(
    updates: Array<{
      questionId: string;
      score: number;
      feedback: string;
    }>,
  ): Promise<void> {
    await Promise.all(
      updates.map(async (update) => {
        const { error } = await this.supabase
          .from("answers")
          .update({
            score: update.score,
            feedback: update.feedback,
            is_draft: false,
          })
          .eq("question_id", update.questionId);

        if (error) {
          throw new Error(error.message);
        }
      }),
    );
  }
}
