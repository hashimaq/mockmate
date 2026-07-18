import { captureException } from "@/lib/monitoring/logger";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/services/auth";
import type { ActivityLog, Interview, Report } from "@/types/database";

/** Cap rows used for dashboard aggregations (keeps queries bounded). */
const DASHBOARD_INTERVIEW_LIMIT = 250;

export type WeeklyPracticePoint = {
  day: string;
  minutes: number;
};

export type PerformancePoint = {
  week: string;
  score: number;
};

export type DashboardOverview = {
  totalInterviews: number;
  averageScore: number | null;
  practiceSeconds: number;
  currentStreak: number;
  recentInterviews: Interview[];
  recentActivity: ActivityLog[];
  recentReports: Report[];
  weeklyPractice: WeeklyPracticePoint[];
  performanceTrend: PerformancePoint[];
  hasInterviews: boolean;
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function toDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function computeStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const uniqueDays = Array.from(
    new Set(dates.map((d) => d.slice(0, 10))),
  ).sort((a, b) => (a < b ? 1 : -1));

  const today = startOfDay(new Date());
  let streak = 0;
  let cursor = today;

  for (const day of uniqueDays) {
    const current = new Date(`${day}T00:00:00`);
    const diffDays = Math.round(
      (cursor.getTime() - current.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 0 || diffDays === 1) {
      streak += 1;
      cursor = current;
      continue;
    }
    break;
  }

  return streak;
}

/** Last 7 calendar days of practice minutes from interview durations. */
function buildWeeklyPractice(interviews: Interview[]): WeeklyPracticePoint[] {
  const today = startOfDay(new Date());
  const buckets = new Map<string, number>();

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    buckets.set(toDayKey(date), 0);
  }

  for (const interview of interviews) {
    const stamp = interview.completed_at ?? interview.created_at;
    const key = stamp.slice(0, 10);
    if (!buckets.has(key)) continue;
    const minutes = Math.round((interview.duration_seconds ?? 0) / 60);
    buckets.set(key, (buckets.get(key) ?? 0) + minutes);
  }

  return Array.from(buckets.entries()).map(([key, minutes]) => {
    const date = new Date(`${key}T00:00:00`);
    return {
      day: DAY_LABELS[date.getDay()] ?? key,
      minutes,
    };
  });
}

/** Up to 6 recent weeks with average scores (only weeks that have scored interviews). */
function buildPerformanceTrend(interviews: Interview[]): PerformancePoint[] {
  const scored = interviews.filter(
    (item) => item.score !== null && !Number.isNaN(Number(item.score)),
  );

  if (scored.length === 0) {
    return [];
  }

  const weekBuckets = new Map<string, { total: number; count: number; sortKey: number }>();

  for (const interview of scored) {
    const stamp = interview.completed_at ?? interview.created_at;
    const date = new Date(stamp);
    const weekStart = startOfDay(date);
    const day = weekStart.getDay();
    weekStart.setDate(weekStart.getDate() - day);

    const key = toDayKey(weekStart);
    const existing = weekBuckets.get(key) ?? {
      total: 0,
      count: 0,
      sortKey: weekStart.getTime(),
    };
    existing.total += Number(interview.score);
    existing.count += 1;
    weekBuckets.set(key, existing);
  }

  return Array.from(weekBuckets.entries())
    .sort((a, b) => a[1].sortKey - b[1].sortKey)
    .slice(-6)
    .map(([, value], index) => ({
      week: `W${index + 1}`,
      score: Math.round(value.total / value.count),
    }));
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const empty: DashboardOverview = {
    totalInterviews: 0,
    averageScore: null,
    practiceSeconds: 0,
    currentStreak: 0,
    recentInterviews: [],
    recentActivity: [],
    recentReports: [],
    weeklyPractice: [],
    performanceTrend: [],
    hasInterviews: false,
  };

  const user = await getSessionUser();
  if (!user) {
    return empty;
  }

  try {
    const supabase = await createClient();

    const [interviewsRes, activityRes, reportsRes] = await Promise.all([
      supabase
        .from("interviews")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(DASHBOARD_INTERVIEW_LIMIT),
      supabase
        .from("activity_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("reports")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    if (interviewsRes.error || activityRes.error || reportsRes.error) {
      captureException(
        interviewsRes.error ?? activityRes.error ?? reportsRes.error,
        { source: "getDashboardOverview" },
      );
      return empty;
    }

    const interviews = interviewsRes.data ?? [];
    const scored = interviews.filter((item) => item.score !== null);
    const averageScore =
      scored.length > 0
        ? scored.reduce((sum, item) => sum + Number(item.score ?? 0), 0) /
          scored.length
        : null;

    const practiceSeconds = interviews.reduce(
      (sum, item) => sum + (item.duration_seconds ?? 0),
      0,
    );

    const streakDates = interviews
      .map((item) => item.completed_at ?? item.created_at)
      .filter((value): value is string => Boolean(value));

    const weeklyPractice = buildWeeklyPractice(interviews);
    const hasWeeklyMinutes = weeklyPractice.some((point) => point.minutes > 0);

    return {
      totalInterviews: interviews.length,
      averageScore,
      practiceSeconds,
      currentStreak: computeStreak(streakDates),
      recentInterviews: interviews.slice(0, 5),
      recentActivity: activityRes.data ?? [],
      recentReports: reportsRes.data ?? [],
      weeklyPractice: hasWeeklyMinutes ? weeklyPractice : [],
      performanceTrend: buildPerformanceTrend(interviews),
      hasInterviews: interviews.length > 0,
    };
  } catch (error) {
    captureException(error, { source: "getDashboardOverview" });
    return empty;
  }
}

export function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return "0m";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.round((totalSeconds % 3600) / 60);
  if (hours <= 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

export function formatScore(score: number | null): string {
  if (score === null || Number.isNaN(score)) return "—";
  return `${Math.round(score)}`;
}
