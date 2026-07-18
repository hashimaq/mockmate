import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { requireStaffProfile } from "@/services/rbac/rbac-service";
import type {
  AdminNotification,
  AdminNotificationStatus,
} from "@/types/database";

export type AdminNotificationQuery = {
  search?: string;
  status?: AdminNotificationStatus | "all";
  eventType?: string | "all";
  page?: number;
  pageSize?: number;
};

export type CreateAdminNotificationInput = {
  eventType: string;
  title: string;
  body?: string | null;
  userEmail?: string | null;
  userName?: string | null;
  metadata?: Record<string, unknown>;
};

export class AdminNotificationService {
  /** Service-role insert — called from notifyAdminEvent (no staff session required). */
  async create(input: CreateAdminNotificationInput): Promise<void> {
    try {
      const admin = createServiceRoleClient();
      await admin.from("admin_notifications").insert({
        event_type: input.eventType,
        title: input.title,
        body: input.body ?? null,
        user_email: input.userEmail ?? null,
        user_name: input.userName ?? null,
        metadata: input.metadata ?? {},
        status: "unread",
      });
    } catch {
      // Table may not exist yet before migration 011
    }
  }

  async list(query: AdminNotificationQuery = {}): Promise<{
    items: AdminNotification[];
    total: number;
    unreadCount: number;
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
      .from("admin_notifications")
      .select("*", { count: "exact" });

    if (query.status && query.status !== "all") {
      builder = builder.eq("status", query.status);
    }
    if (query.eventType && query.eventType !== "all") {
      builder = builder.eq("event_type", query.eventType);
    }
    if (query.search?.trim()) {
      const q = `%${query.search.trim()}%`;
      builder = builder.or(
        `title.ilike.${q},body.ilike.${q},user_email.ilike.${q},user_name.ilike.${q}`,
      );
    }

    const [{ data, error, count }, unreadRes] = await Promise.all([
      builder.order("created_at", { ascending: false }).range(from, to),
      supabase
        .from("admin_notifications")
        .select("id", { count: "exact", head: true })
        .eq("status", "unread"),
    ]);

    if (error) {
      return {
        items: [],
        total: 0,
        unreadCount: 0,
        page,
        pageSize,
      };
    }

    return {
      items: data ?? [],
      total: count ?? 0,
      unreadCount: unreadRes.count ?? 0,
      page,
      pageSize,
    };
  }

  async setStatus(
    id: string,
    status: AdminNotificationStatus,
  ): Promise<void> {
    await requireStaffProfile();
    const supabase = await createClient();
    const { error } = await supabase
      .from("admin_notifications")
      .update({ status })
      .eq("id", id);
    if (error) throw new Error(error.message);
  }

  async markAllRead(): Promise<void> {
    await requireStaffProfile();
    const supabase = await createClient();
    const { error } = await supabase
      .from("admin_notifications")
      .update({ status: "read" })
      .eq("status", "unread");
    if (error) throw new Error(error.message);
  }

  async unreadCount(): Promise<number> {
    await requireStaffProfile();
    const supabase = await createClient();
    const { count } = await supabase
      .from("admin_notifications")
      .select("id", { count: "exact", head: true })
      .eq("status", "unread");
    return count ?? 0;
  }
}
