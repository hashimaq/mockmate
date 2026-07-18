import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import {
  isSuperAdmin,
  requireStaffProfile,
  requireSuperAdminProfile,
} from "@/services/rbac/rbac-service";
import type { AccountStatus, Profile, UserRole } from "@/types/database";

export type AdminUserListQuery = {
  search?: string;
  role?: UserRole | "all";
  status?: AccountStatus | "all";
  page?: number;
  pageSize?: number;
  sort?: "created_at" | "email" | "full_name";
  order?: "asc" | "desc";
};

export type AdminUserListResult = {
  users: Profile[];
  total: number;
  page: number;
  pageSize: number;
};

export class AdminUserService {
  async listUsers(query: AdminUserListQuery = {}): Promise<AdminUserListResult> {
    await requireStaffProfile();

    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(50, Math.max(5, query.pageSize ?? 20));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const sort = query.sort ?? "created_at";
    const ascending = (query.order ?? "desc") === "asc";

    const admin = createServiceRoleClient();
    let builder = admin.from("profiles").select("*", { count: "exact" });

    if (query.search?.trim()) {
      const q = `%${query.search.trim()}%`;
      builder = builder.or(`email.ilike.${q},full_name.ilike.${q}`);
    }
    if (query.role && query.role !== "all") {
      builder = builder.eq("role", query.role);
    }
    if (query.status && query.status !== "all") {
      builder = builder.eq("status", query.status);
    }

    const { data, error, count } = await builder
      .order(sort, { ascending })
      .range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    return {
      users: data ?? [],
      total: count ?? 0,
      page,
      pageSize,
    };
  }

  async getUser(userId: string): Promise<Profile | null> {
    await requireStaffProfile();
    const admin = createServiceRoleClient();
    const { data, error } = await admin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }

  async getUserDetail(userId: string): Promise<{
    profile: Profile;
    lastSignInAt: string | null;
    resume: {
      id: string;
      file_name: string;
      analysis_status: string;
      uploaded_at: string;
      file_size: number;
    } | null;
    interviews: Array<{
      id: string;
      title: string;
      status: string;
      score: number | null;
      target_company: string | null;
      created_at: string;
    }>;
    reports: Array<{
      id: string;
      interview_id: string;
      overall_score: number | null;
      status: string;
      created_at: string;
    }>;
    activity: Array<{
      id: string;
      action: string;
      description: string | null;
      created_at: string;
    }>;
  } | null> {
    await requireStaffProfile();
    const admin = createServiceRoleClient();
    const profile = await this.getUser(userId);
    if (!profile) return null;

    const [{ data: authData }, resumeRes, interviewsRes, reportsRes, activityRes] =
      await Promise.all([
        admin.auth.admin.getUserById(userId),
        admin
          .from("resumes")
          .select("id, file_name, analysis_status, uploaded_at, file_size")
          .eq("user_id", userId)
          .order("uploaded_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        admin
          .from("interviews")
          .select("id, title, status, score, target_company, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(40),
        admin
          .from("reports")
          .select("id, interview_id, overall_score, status, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(40),
        admin
          .from("activity_logs")
          .select("id, action, description, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

    return {
      profile,
      lastSignInAt: authData.user?.last_sign_in_at ?? null,
      resume: resumeRes.data ?? null,
      interviews: interviewsRes.data ?? [],
      reports: reportsRes.data ?? [],
      activity: activityRes.data ?? [],
    };
  }

  async setStatus(userId: string, status: AccountStatus): Promise<void> {
    const actor = await requireStaffProfile();
    const target = await this.getUser(userId);
    if (!target) throw new Error("User not found");
    if (isSuperAdmin(target.role) && !isSuperAdmin(actor.role)) {
      throw new Error("Admins cannot modify Super Admin accounts");
    }
    if (target.id === actor.id) {
      throw new Error("You cannot change your own account status");
    }

    const admin = createServiceRoleClient();
    const { error } = await admin
      .from("profiles")
      .update({ status })
      .eq("id", userId);
    if (error) throw new Error(error.message);
  }

  async setRole(userId: string, role: UserRole): Promise<void> {
    const actor = await requireSuperAdminProfile();
    const target = await this.getUser(userId);
    if (!target) throw new Error("User not found");
    if (target.id === actor.id) {
      throw new Error("You cannot change your own role");
    }
    if (role === "super_admin") {
      throw new Error("Use ownership transfer to assign Super Admin");
    }
    if (target.role === "super_admin") {
      throw new Error("Cannot demote Super Admin via role change");
    }

    const admin = createServiceRoleClient();
    const { error } = await admin
      .from("profiles")
      .update({ role })
      .eq("id", userId);
    if (error) throw new Error(error.message);
  }

  async deleteUser(userId: string): Promise<void> {
    const actor = await requireStaffProfile();
    const target = await this.getUser(userId);
    if (!target) throw new Error("User not found");
    if (isSuperAdmin(target.role)) {
      throw new Error("Super Admin accounts cannot be deleted");
    }
    if (target.id === actor.id) {
      throw new Error("You cannot delete your own account");
    }
    if (target.role === "admin" && !isSuperAdmin(actor.role)) {
      throw new Error("Only Super Admin can delete admin accounts");
    }

    const admin = createServiceRoleClient();
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);
  }
}
