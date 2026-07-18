import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isResumeInterviewTitle } from "@/features/resumes/lib/resume-interview-gate";
import type { DailyDigestStats } from "@/services/notifications/daily-digest";

export type AdminDashboardStats = {
  totalUsers: number;
  verifiedUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  totalInterviews: number;
  interviewsToday: number;
  resumeInterviews: number;
  voiceInterviews: number;
  companyInterviews: number;
  averageScore: number | null;
  averageDurationSeconds: number | null;
  aiReportsGenerated: number;
  resumeUploads: number;
  storageUsageBytes: number;
  failedAiRequests: number;
  topRoles: Array<{ label: string; count: number }>;
  topCompanies: Array<{ label: string; count: number }>;
  topTechnologies: Array<{ label: string; count: number }>;
};

export type AdminChartPoint = { label: string; value: number };

export type AdminAnalyticsCharts = {
  dailySignups: AdminChartPoint[];
  monthlyGrowth: AdminChartPoint[];
  interviewTrend: AdminChartPoint[];
  averageScoreTrend: AdminChartPoint[];
  resumeUsage: AdminChartPoint[];
  companyUsage: AdminChartPoint[];
  topRoles: AdminChartPoint[];
  topCompanies: AdminChartPoint[];
  topTechnologies: AdminChartPoint[];
  mostActiveUsers: Array<{ email: string; name: string | null; count: number }>;
};

export type SystemHealthSnapshot = {
  databaseStatus: "ok" | "error";
  databaseLatencyMs: number;
  storageUsageBytes: number;
  storageStatus: "ok" | "warning" | "error";
  aiApiStatus: "ok" | "degraded" | "error";
  avgReportGenerationMs: number | null;
  failedRequests: number;
  serverHealth: "ok" | "degraded";
  environmentReady: boolean;
  aiResponseHint: string;
};

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek(): Date {
  const d = startOfToday();
  d.setDate(d.getDate() - 6);
  return d;
}

function startOfMonth(): Date {
  const d = startOfToday();
  d.setDate(1);
  return d;
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function countByDay(
  dates: string[],
  days: number,
): AdminChartPoint[] {
  const start = startOfToday();
  start.setDate(start.getDate() - (days - 1));
  const map = new Map<string, number>();
  for (let i = 0; i < days; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    map.set(dayKey(d), 0);
  }
  for (const iso of dates) {
    const key = iso.slice(0, 10);
    if (map.has(key)) map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries()).map(([label, value]) => ({
    label: label.slice(5),
    value,
  }));
}

export class AdminAnalyticsService {
  async getDashboardStats(): Promise<AdminDashboardStats> {
    const supabase = await createClient();
    const todayIso = startOfToday().toISOString();
    const weekIso = startOfWeek().toISOString();
    const monthIso = startOfMonth().toISOString();

    const [
      usersRes,
      usersTodayRes,
      usersWeekRes,
      usersMonthRes,
      activeUsersRes,
      interviewsRes,
      interviewsTodayRes,
      reportsRes,
      resumesRes,
      failedRes,
      analysisRes,
    ] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("created_at", todayIso),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("created_at", weekIso),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("created_at", monthIso),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
      supabase
        .from("interviews")
        .select(
          "id, title, target_company, score, status, duration_seconds, role_target, created_at",
        )
        .limit(3000),
      supabase
        .from("interviews")
        .select("id", { count: "exact", head: true })
        .gte("created_at", todayIso),
      supabase
        .from("reports")
        .select("id", { count: "exact", head: true })
        .eq("status", "completed"),
      supabase.from("resumes").select("file_size"),
      supabase
        .from("activity_logs")
        .select("id", { count: "exact", head: true })
        .in("action", ["report_failed", "ai_error", "critical_ai_error"]),
      supabase
        .from("resume_analysis")
        .select("programming_languages, frameworks, tools")
        .limit(500),
    ]);

    const interviews = interviewsRes.data ?? [];
    const scored = interviews
      .map((row) => row.score)
      .filter(
        (score): score is number =>
          score !== null && !Number.isNaN(Number(score)),
      )
      .map(Number);
    const averageScore =
      scored.length > 0
        ? scored.reduce((sum, value) => sum + value, 0) / scored.length
        : null;

    const durations = interviews
      .map((row) => row.duration_seconds ?? 0)
      .filter((n) => n > 0);
    const averageDurationSeconds =
      durations.length > 0
        ? Math.round(
            durations.reduce((sum, value) => sum + value, 0) /
              durations.length,
          )
        : null;

    const storageUsageBytes = (resumesRes.data ?? []).reduce(
      (sum, row) => sum + (row.file_size ?? 0),
      0,
    );

    const roleCounts = new Map<string, number>();
    const companyCounts = new Map<string, number>();
    for (const row of interviews) {
      const role = row.role_target?.trim() || "Unknown";
      roleCounts.set(role, (roleCounts.get(role) ?? 0) + 1);
      if (row.target_company) {
        companyCounts.set(
          row.target_company,
          (companyCounts.get(row.target_company) ?? 0) + 1,
        );
      }
    }

    const techCounts = new Map<string, number>();
    for (const row of analysisRes.data ?? []) {
      for (const list of [
        row.programming_languages ?? [],
        row.frameworks ?? [],
        row.tools ?? [],
      ]) {
        for (const item of list) {
          const label = String(item).trim();
          if (!label) continue;
          techCounts.set(label, (techCounts.get(label) ?? 0) + 1);
        }
      }
    }

    const toTop = (map: Map<string, number>, limit = 5) =>
      Array.from(map.entries())
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);

    return {
      totalUsers: usersRes.count ?? 0,
      // Email confirmation is Auth-side; active non-suspended approximates verified for ops
      verifiedUsers: activeUsersRes.count ?? 0,
      activeUsers: activeUsersRes.count ?? 0,
      newUsersToday: usersTodayRes.count ?? 0,
      newUsersThisWeek: usersWeekRes.count ?? 0,
      newUsersThisMonth: usersMonthRes.count ?? 0,
      totalInterviews: interviews.length,
      interviewsToday: interviewsTodayRes.count ?? 0,
      resumeInterviews: interviews.filter((row) =>
        isResumeInterviewTitle(row.title),
      ).length,
      voiceInterviews: 0,
      companyInterviews: interviews.filter((row) =>
        Boolean(row.target_company),
      ).length,
      averageScore,
      averageDurationSeconds,
      aiReportsGenerated: reportsRes.count ?? 0,
      resumeUploads: resumesRes.data?.length ?? 0,
      storageUsageBytes,
      failedAiRequests: failedRes.count ?? 0,
      topRoles: toTop(roleCounts),
      topCompanies: toTop(companyCounts),
      topTechnologies: toTop(techCounts),
    };
  }

  async getCharts(): Promise<AdminAnalyticsCharts> {
    const supabase = await createClient();
    const since30 = startOfToday();
    since30.setDate(since30.getDate() - 29);
    const sinceIso = since30.toISOString();

    const [profilesRes, interviewsRes, resumesRes, analysisRes] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("created_at")
          .gte("created_at", sinceIso)
          .limit(5000),
        supabase
          .from("interviews")
          .select(
            "created_at, score, title, target_company, role_target, user_id",
          )
          .gte("created_at", sinceIso)
          .limit(5000),
        supabase
          .from("resumes")
          .select("uploaded_at")
          .gte("uploaded_at", sinceIso)
          .limit(5000),
        supabase
          .from("resume_analysis")
          .select("programming_languages, frameworks")
          .limit(500),
      ]);

    const interviews = interviewsRes.data ?? [];
    const dailySignups = countByDay(
      (profilesRes.data ?? []).map((r) => r.created_at),
      14,
    );
    const interviewTrend = countByDay(
      interviews.map((r) => r.created_at),
      14,
    );
    const resumeUsage = countByDay(
      (resumesRes.data ?? []).map((r) => r.uploaded_at),
      14,
    );
    const companyUsage = countByDay(
      interviews
        .filter((r) => Boolean(r.target_company))
        .map((r) => r.created_at),
      14,
    );

    // Monthly growth (last 6 months)
    const monthMap = new Map<string, number>();
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthMap.set(key, 0);
    }
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    const { data: allProfiles } = await supabase
      .from("profiles")
      .select("created_at")
      .gte("created_at", sixMonthsAgo.toISOString())
      .limit(10000);
    for (const row of allProfiles ?? []) {
      const key = row.created_at.slice(0, 7);
      if (monthMap.has(key)) {
        monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
      }
    }

    // Score trend by day (avg) — align with last 14 calendar days
    const scoreDay = new Map<string, number[]>();
    for (const row of interviews) {
      if (row.score === null) continue;
      const key = row.created_at.slice(0, 10);
      const list = scoreDay.get(key) ?? [];
      list.push(Number(row.score));
      scoreDay.set(key, list);
    }
    const scoreScaffold = countByDay([], 14);
    const averageScoreTrend = scoreScaffold.map((point) => {
      const matching = Array.from(scoreDay.entries()).find(([k]) =>
        k.endsWith(point.label),
      );
      const scores = matching?.[1] ?? [];
      return {
        label: point.label,
        value:
          scores.length > 0
            ? Math.round(
                scores.reduce((s, v) => s + v, 0) / scores.length,
              )
            : 0,
      };
    });

    const roleCounts = new Map<string, number>();
    const companyCounts = new Map<string, number>();
    const userCounts = new Map<string, number>();
    for (const row of interviews) {
      const role = row.role_target?.trim() || "Unknown";
      roleCounts.set(role, (roleCounts.get(role) ?? 0) + 1);
      if (row.target_company) {
        companyCounts.set(
          row.target_company,
          (companyCounts.get(row.target_company) ?? 0) + 1,
        );
      }
      userCounts.set(row.user_id, (userCounts.get(row.user_id) ?? 0) + 1);
    }

    const techCounts = new Map<string, number>();
    for (const row of analysisRes.data ?? []) {
      for (const item of [
        ...(row.programming_languages ?? []),
        ...(row.frameworks ?? []),
      ]) {
        const label = String(item).trim();
        if (label) techCounts.set(label, (techCounts.get(label) ?? 0) + 1);
      }
    }

    const topUserIds = Array.from(userCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
    const { data: topProfiles } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .in(
        "id",
        topUserIds.map(([id]) => id),
      );

    const profileMap = new Map(
      (topProfiles ?? []).map((p) => [p.id, p] as const),
    );

    const toPoints = (map: Map<string, number>, limit = 6) =>
      Array.from(map.entries())
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, limit);

    return {
      dailySignups,
      monthlyGrowth: Array.from(monthMap.entries()).map(([label, value]) => ({
        label,
        value,
      })),
      interviewTrend,
      averageScoreTrend,
      resumeUsage,
      companyUsage,
      topRoles: toPoints(roleCounts),
      topCompanies: toPoints(companyCounts),
      topTechnologies: toPoints(techCounts),
      mostActiveUsers: topUserIds.map(([id, count]) => ({
        email: profileMap.get(id)?.email ?? id.slice(0, 8),
        name: profileMap.get(id)?.full_name ?? null,
        count,
      })),
    };
  }

  async getSystemHealth(): Promise<SystemHealthSnapshot> {
    const supabase = await createClient();
    const started = Date.now();
    const { error } = await supabase.from("profiles").select("id").limit(1);
    const dbMs = Date.now() - started;

    const stats = await this.getDashboardStats();

    const { data: reports } = await supabase
      .from("reports")
      .select("started_at, completed_at")
      .eq("status", "completed")
      .not("started_at", "is", null)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(40);

    const durations =
      reports
        ?.map((row) => {
          if (!row.started_at || !row.completed_at) return null;
          return (
            new Date(row.completed_at).getTime() -
            new Date(row.started_at).getTime()
          );
        })
        .filter((ms): ms is number => typeof ms === "number" && ms > 0) ?? [];

    const avgReportGenerationMs =
      durations.length > 0
        ? Math.round(
            durations.reduce((sum, value) => sum + value, 0) /
              durations.length,
          )
        : null;

    const envReady = Boolean(
      process.env.GEMINI_API_KEY?.trim() &&
        process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
        process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
    );

    const storageStatus: SystemHealthSnapshot["storageStatus"] =
      stats.storageUsageBytes > 5 * 1024 * 1024 * 1024
        ? "warning"
        : "ok";

    const aiApiStatus: SystemHealthSnapshot["aiApiStatus"] =
      stats.failedAiRequests > 20
        ? "degraded"
        : process.env.GEMINI_API_KEY?.trim()
          ? "ok"
          : "error";

    return {
      databaseStatus: error ? "error" : "ok",
      databaseLatencyMs: dbMs,
      storageUsageBytes: stats.storageUsageBytes,
      storageStatus,
      aiApiStatus,
      avgReportGenerationMs,
      failedRequests: stats.failedAiRequests,
      serverHealth: dbMs > 800 || Boolean(error) ? "degraded" : "ok",
      environmentReady: envReady,
      aiResponseHint:
        dbMs < 400
          ? "Database responsive"
          : "Database latency elevated — check Supabase region/load",
    };
  }

  async buildDailyDigestStats(day = new Date()): Promise<DailyDigestStats> {
    const supabase = await createClient();
    const start = new Date(day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const startIso = start.toISOString();
    const endIso = end.toISOString();

    const [users, interviews, resumes, failed] = await Promise.all([
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("created_at", startIso)
        .lt("created_at", endIso),
      supabase
        .from("interviews")
        .select("role_target, target_company, score, title")
        .gte("created_at", startIso)
        .lt("created_at", endIso),
      supabase
        .from("resumes")
        .select("id", { count: "exact", head: true })
        .gte("uploaded_at", startIso)
        .lt("uploaded_at", endIso),
      supabase
        .from("activity_logs")
        .select("id", { count: "exact", head: true })
        .in("action", ["report_failed", "ai_error", "critical_ai_error"])
        .gte("created_at", startIso)
        .lt("created_at", endIso),
    ]);

    const rows = interviews.data ?? [];
    const roleCounts = new Map<string, number>();
    const companyCounts = new Map<string, number>();
    const scores: number[] = [];

    for (const row of rows) {
      const role = row.role_target?.trim() || "Unknown";
      roleCounts.set(role, (roleCounts.get(role) ?? 0) + 1);
      if (row.target_company) {
        companyCounts.set(
          row.target_company,
          (companyCounts.get(row.target_company) ?? 0) + 1,
        );
      }
      if (row.score !== null) scores.push(Number(row.score));
    }

    const topRoles = Array.from(roleCounts.entries())
      .map(([role, count]) => ({ role, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    const topCompanies = Array.from(companyCounts.entries())
      .map(([company, count]) => ({ company, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      date: start.toISOString().slice(0, 10),
      newUsers: users.count ?? 0,
      interviews: rows.length,
      resumeUploads: resumes.count ?? 0,
      companyInterviews: rows.filter((row) => Boolean(row.target_company))
        .length,
      voiceInterviews: 0,
      averageScore:
        scores.length > 0
          ? Math.round(
              scores.reduce((sum, value) => sum + value, 0) / scores.length,
            )
          : null,
      topRoles,
      topCompanies,
      aiErrors: failed.count ?? 0,
      systemStatus: "healthy",
    };
  }
}
