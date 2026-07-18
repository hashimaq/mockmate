import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireStaffProfile } from "@/services/rbac/rbac-service";
import type {
  PlatformFeedback,
  PlatformFeedbackCategory,
  PlatformFeedbackStatus,
} from "@/types/database";

export type AdminFeedbackQuery = {
  category?: PlatformFeedbackCategory | "all";
  status?: PlatformFeedbackStatus | "all";
  search?: string;
  page?: number;
  pageSize?: number;
};

export class AdminFeedbackService {
  async list(query: AdminFeedbackQuery = {}): Promise<{
    items: PlatformFeedback[];
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
      .from("platform_feedback")
      .select("*", { count: "exact" });

    if (query.category && query.category !== "all") {
      builder = builder.eq("category", query.category);
    }
    if (query.status && query.status !== "all") {
      builder = builder.eq("status", query.status);
    }
    if (query.search?.trim()) {
      const q = `%${query.search.trim()}%`;
      builder = builder.or(
        `subject.ilike.${q},message.ilike.${q},submitter_email.ilike.${q}`,
      );
    }

    const { data, error, count } = await builder
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      return { items: [], total: 0, page, pageSize };
    }

    return {
      items: data ?? [],
      total: count ?? 0,
      page,
      pageSize,
    };
  }

  async updateStatus(
    id: string,
    status: PlatformFeedbackStatus,
    adminNotes?: string | null,
  ): Promise<void> {
    await requireStaffProfile();
    const supabase = await createClient();
    const { error } = await supabase
      .from("platform_feedback")
      .update({
        status,
        admin_notes: adminNotes ?? undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw new Error(error.message);
  }
}
