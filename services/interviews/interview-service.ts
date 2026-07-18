import type { SupabaseClient } from "@supabase/supabase-js";

import type { CreateInterviewInput } from "@/features/interviews/schemas/interview";
import { resolveDurationMinutes } from "@/features/interviews/schemas/interview";
import type { Database, Interview } from "@/types/database";

type Client = SupabaseClient<Database>;

function buildTitle(input: CreateInterviewInput): string {
  const typeLabel =
    input.interviewType.charAt(0).toUpperCase() + input.interviewType.slice(1);
  const companyPart = input.targetCompany
    ? `${input.targetCompany} · `
    : "";
  const base = `${companyPart}${typeLabel} · ${input.roleTarget}`;
  return input.resumeMode ? `Resume · ${base}` : base;
}

export class InterviewService {
  constructor(private readonly supabase: Client) {}

  async listForUser(userId: string, limit = 100): Promise<Interview[]> {
    const { data, error } = await this.supabase
      .from("interviews")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  }

  /** Lightweight lookup for report list titles — avoids fetching full interview rows. */
  async listTitlesForUser(
    userId: string,
    limit = 100,
  ): Promise<Array<{ id: string; title: string }>> {
    const { data, error } = await this.supabase
      .from("interviews")
      .select("id, title")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  }

  async getById(interviewId: string, userId: string): Promise<Interview | null> {
    const { data, error } = await this.supabase
      .from("interviews")
      .select("*")
      .eq("id", interviewId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async createSession(
    userId: string,
    input: CreateInterviewInput,
  ): Promise<Interview> {
    const minutes = resolveDurationMinutes(input);
    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + minutes * 60 * 1000);

    const { data, error } = await this.supabase
      .from("interviews")
      .insert({
        user_id: userId,
        title: buildTitle(input),
        interview_type: input.interviewType,
        role_target: input.roleTarget,
        experience_level: input.experienceLevel,
        difficulty: input.difficulty,
        target_company: input.targetCompany,
        status: "in_progress",
        planned_duration_minutes: minutes,
        duration_seconds: 0,
        current_question_index: 0,
        elapsed_seconds: 0,
        started_at: startedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async updateProgress(
    interviewId: string,
    userId: string,
    patch: {
      currentQuestionIndex?: number;
      elapsedSeconds?: number;
      durationSeconds?: number;
    },
  ): Promise<void> {
    const payload: Database["public"]["Tables"]["interviews"]["Update"] = {};
    if (patch.currentQuestionIndex !== undefined) {
      payload.current_question_index = patch.currentQuestionIndex;
    }
    if (patch.elapsedSeconds !== undefined) {
      payload.elapsed_seconds = patch.elapsedSeconds;
    }
    if (patch.durationSeconds !== undefined) {
      payload.duration_seconds = patch.durationSeconds;
    }

    const { error } = await this.supabase
      .from("interviews")
      .update(payload)
      .eq("id", interviewId)
      .eq("user_id", userId);

    if (error) {
      throw new Error(error.message);
    }
  }

  async complete(interviewId: string, userId: string, elapsedSeconds: number) {
    const { data, error } = await this.supabase
      .from("interviews")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        elapsed_seconds: elapsedSeconds,
        duration_seconds: elapsedSeconds,
      })
      .eq("id", interviewId)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async markAbandoned(interviewId: string, userId: string) {
    const { error } = await this.supabase
      .from("interviews")
      .update({ status: "abandoned" })
      .eq("id", interviewId)
      .eq("user_id", userId)
      .eq("status", "in_progress");

    if (error) {
      throw new Error(error.message);
    }
  }

  async deleteSession(interviewId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("interviews")
      .delete()
      .eq("id", interviewId)
      .eq("user_id", userId);

    if (error) {
      throw new Error(error.message);
    }
  }

  async setScore(
    interviewId: string,
    userId: string,
    score: number,
  ): Promise<void> {
    const { error } = await this.supabase
      .from("interviews")
      .update({ score })
      .eq("id", interviewId)
      .eq("user_id", userId);

    if (error) {
      throw new Error(error.message);
    }
  }

  isExpired(interview: Interview): boolean {
    if (!interview.expires_at) return false;
    if (interview.status === "completed" || interview.status === "abandoned") {
      return false;
    }
    return new Date(interview.expires_at).getTime() < Date.now();
  }
}
