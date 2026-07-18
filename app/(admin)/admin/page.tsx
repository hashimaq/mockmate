import type { Metadata } from "next";
import Link from "next/link";

import {
  AdminPageHeader,
  AdminPanel,
  AdminStatCard,
  formatBytes,
} from "@/features/admin/components/admin-ui";
import { AdminAnalyticsService } from "@/services/admin/admin-analytics-service";
import { requireStaffProfile } from "@/services/rbac/rbac-service";

export const metadata: Metadata = {
  title: "Admin Overview",
};

export default async function AdminOverviewPage() {
  await requireStaffProfile();
  const stats = await new AdminAnalyticsService().getDashboardStats();

  const cards = [
    { label: "Total Users", value: stats.totalUsers },
    { label: "Verified / Active Users", value: stats.verifiedUsers },
    { label: "New Users Today", value: stats.newUsersToday },
    { label: "New Users This Week", value: stats.newUsersThisWeek },
    { label: "New Users This Month", value: stats.newUsersThisMonth },
    { label: "Total Interviews", value: stats.totalInterviews },
    { label: "Today's Interviews", value: stats.interviewsToday },
    { label: "Resume Interviews", value: stats.resumeInterviews },
    { label: "Voice Interviews", value: stats.voiceInterviews, hint: "Persisted when voice flag ships" },
    { label: "Company Interviews", value: stats.companyInterviews },
    {
      label: "Average Interview Score",
      value:
        stats.averageScore === null
          ? "—"
          : Math.round(stats.averageScore),
    },
    {
      label: "Avg Interview Duration",
      value:
        stats.averageDurationSeconds === null
          ? "—"
          : `${Math.round(stats.averageDurationSeconds / 60)}m`,
    },
    { label: "AI Reports Generated", value: stats.aiReportsGenerated },
    { label: "Resume Uploads", value: stats.resumeUploads },
    { label: "Storage Usage", value: formatBytes(stats.storageUsageBytes) },
    {
      label: "Failed AI Requests",
      value: stats.failedAiRequests,
      tone: stats.failedAiRequests > 0 ? ("danger" as const) : ("ok" as const),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Platform overview"
        description="Live statistics across the entire MockMate platform — not your personal account."
        actions={
          <>
            <Link
              href="/admin/analytics"
              className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted"
            >
              Open analytics
            </Link>
            <Link
              href="/admin/users"
              className="admin-btn-primary rounded-xl px-3 py-2 text-xs font-semibold"
            >
              Manage users
            </Link>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <AdminStatCard
            key={card.label}
            label={card.label}
            value={card.value}
            hint={card.hint}
            tone={card.tone}
          />
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <AdminPanel title="Most popular job roles">
          <TopList items={stats.topRoles} empty="No interview roles yet" />
        </AdminPanel>
        <AdminPanel title="Most popular companies">
          <TopList items={stats.topCompanies} empty="No company interviews yet" />
        </AdminPanel>
        <AdminPanel title="Most popular technologies">
          <TopList
            items={stats.topTechnologies}
            empty="No resume tech signals yet"
          />
        </AdminPanel>
      </div>
    </div>
  );
}

function TopList({
  items,
  empty,
}: {
  items: Array<{ label: string; count: number }>;
  empty: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{empty}</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item.label}
          className="flex items-center justify-between gap-3 text-sm"
        >
          <span className="truncate text-foreground">{item.label}</span>
          <span className="tabular-nums text-muted-foreground">
            {item.count}
          </span>
        </li>
      ))}
    </ul>
  );
}
