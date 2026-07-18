import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isResumeInterviewTitle } from "@/features/resumes/lib/resume-interview-gate";
import { requireStaffProfile } from "@/services/rbac/rbac-service";
import type { Interview, InterviewStatus, Report } from "@/types/database";

export type AdminInterviewListQuery = {
  search?: string;
  status?: InterviewStatus | "all";
  mode?: "all" | "resume" | "company" | "standard";
  page?: number;
  pageSize?: number;
};

export type AdminInterviewRow = Interview & {
  user_email?: string | null;
  user_name?: string | null;
};

export class AdminInterviewService {
  async list(query: AdminInterviewListQuery = {}): Promise<{
    items: AdminInterviewRow[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    await requireStaffProfile();
    const supabase = await createClient();
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(50, Math.max(5, query.pageSize ?? 20));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let builder = supabase
      .from("interviews")
      .select("*", { count: "exact" });

    if (query.status && query.status !== "all") {
      builder = builder.eq("status", query.status);
    }
    if (query.search?.trim()) {
      const q = `%${query.search.trim()}%`;
      builder = builder.or(
        `title.ilike.${q},role_target.ilike.${q},target_company.ilike.${q}`,
      );
    }

    const { data, error, count } = await builder
      .order("created_at", { ascending: false })
      .range(from, Math.min(to + 200, from + 499));

    if (error) {
      return { items: [], total: 0, page, pageSize };
    }

    let rows = data ?? [];
    if (query.mode === "resume") {
      rows = rows.filter((row) => isResumeInterviewTitle(row.title));
    } else if (query.mode === "company") {
      rows = rows.filter((row) => Boolean(row.target_company));
    } else if (query.mode === "standard") {
      rows = rows.filter(
        (row) =>
          !isResumeInterviewTitle(row.title) && !row.target_company,
      );
    }

    const total =
      query.mode && query.mode !== "all" ? rows.length : (count ?? 0);
    const pageRows = rows.slice(0, pageSize);

    const userIds = Array.from(new Set(pageRows.map((row) => row.user_id)));
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .in("id", userIds);

    const profileMap = new Map(
      (profiles ?? []).map((p) => [p.id, p] as const),
    );

    return {
      items: pageRows.map((row) => ({
        ...row,
        user_email: profileMap.get(row.user_id)?.email ?? null,
        user_name: profileMap.get(row.user_id)?.full_name ?? null,
      })),
      total,
      page,
      pageSize,
    };
  }

  async getDetail(interviewId: string): Promise<{
    interview: AdminInterviewRow | null;
    report: Report | null;
    answers: Array<{
      prompt: string;
      content: string;
      score: number | null;
      feedback: string | null;
      order_index: number;
    }>;
  }> {
    await requireStaffProfile();
    const supabase = await createClient();

    const { data: interview } = await supabase
      .from("interviews")
      .select("*")
      .eq("id", interviewId)
      .maybeSingle();

    if (!interview) {
      return { interview: null, report: null, answers: [] };
    }

    const [{ data: profile }, { data: report }, { data: questions }] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", interview.user_id)
          .maybeSingle(),
        supabase
          .from("reports")
          .select("*")
          .eq("interview_id", interviewId)
          .maybeSingle(),
        supabase
          .from("questions")
          .select("id, prompt, order_index")
          .eq("interview_id", interviewId)
          .order("order_index", { ascending: true }),
      ]);

    const questionIds = (questions ?? []).map((q) => q.id);
    const { data: answers } =
      questionIds.length > 0
        ? await supabase
            .from("answers")
            .select("question_id, content, score, feedback")
            .in("question_id", questionIds)
        : { data: [] };

    const answerMap = new Map(
      (answers ?? []).map((a) => [a.question_id, a] as const),
    );

    return {
      interview: {
        ...interview,
        user_email: profile?.email ?? null,
        user_name: profile?.full_name ?? null,
      },
      report: report ?? null,
      answers: (questions ?? []).map((q) => {
        const answer = answerMap.get(q.id);
        return {
          prompt: q.prompt,
          content: answer?.content ?? "",
          score: answer?.score ?? null,
          feedback: answer?.feedback ?? null,
          order_index: q.order_index,
        };
      }),
    };
  }
}
