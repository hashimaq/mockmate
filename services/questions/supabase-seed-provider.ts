import type { SupabaseClient } from "@supabase/supabase-js";

import type { QuestionDraft, QuestionProvider, QuestionQuery } from "@/services/questions/types";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

/**
 * Temporary provider: reads a small seed catalog from Supabase.
 * Replace with an AI provider later without changing QuestionService consumers.
 */
export class SupabaseSeedQuestionProvider implements QuestionProvider {
  constructor(private readonly supabase: Client) {}

  async getQuestions(query: QuestionQuery): Promise<QuestionDraft[]> {
    const limit = query.limit ?? 5;

    const selectCols =
      "prompt, category, role_target, experience_level, interview_type, difficulty";

    const primary = await this.supabase
      .from("seed_questions")
      .select(selectCols)
      .eq("is_active", true)
      .eq("difficulty", query.difficulty)
      .in("interview_type", [query.interviewType, "mixed"])
      .limit(40);

    if (primary.error) {
      throw new Error(primary.error.message);
    }

    let rows = primary.data ?? [];

    // Broader fallback so sessions still get seed content when filters are sparse
    if (rows.length === 0) {
      const fallback = await this.supabase
        .from("seed_questions")
        .select(selectCols)
        .eq("is_active", true)
        .in("interview_type", [query.interviewType, "mixed"])
        .limit(40);

      if (fallback.error) {
        throw new Error(fallback.error.message);
      }
      rows = fallback.data ?? [];
    }

    if (rows.length === 0) {
      return [];
    }

    const scored = rows
      .map((row) => {
        let score = 0;
        if (row.interview_type === query.interviewType) score += 4;
        if (
          row.role_target &&
          row.role_target.toLowerCase() === query.roleTarget.toLowerCase()
        ) {
          score += 3;
        }
        if (row.experience_level === query.experienceLevel) score += 2;
        if (!row.role_target) score += 1;
        return { row, score };
      })
      .sort((a, b) => b.score - a.score);

    const uniquePrompts = new Set<string>();
    const selected: QuestionDraft[] = [];

    for (const item of scored) {
      if (uniquePrompts.has(item.row.prompt)) continue;
      uniquePrompts.add(item.row.prompt);
      selected.push({
        prompt: item.row.prompt,
        category: item.row.category,
        order_index: selected.length,
      });
      if (selected.length >= limit) break;
    }

    return selected;
  }
}
