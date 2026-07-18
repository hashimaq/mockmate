import type { Metadata } from "next";

import {
  AdminBarChart,
  AdminLineChart,
} from "@/features/admin/components/admin-charts";
import {
  AdminPageHeader,
  AdminPanel,
  AdminStatCard,
} from "@/features/admin/components/admin-ui";
import { AdminAnalyticsService } from "@/services/admin/admin-analytics-service";
import { requireStaffProfile } from "@/services/rbac/rbac-service";

export const metadata: Metadata = {
  title: "Admin Analytics",
};

export default async function AdminAnalyticsPage() {
  await requireStaffProfile();
  const service = new AdminAnalyticsService();
  const [stats, charts, digest] = await Promise.all([
    service.getDashboardStats(),
    service.getCharts(),
    service.buildDailyDigestStats(),
  ]);

  return (
    <div>
      <AdminPageHeader
        title="Platform analytics"
        description="Enterprise trends across signups, interviews, resumes, and scores."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Total users" value={stats.totalUsers} />
        <AdminStatCard label="Total interviews" value={stats.totalInterviews} />
        <AdminStatCard
          label="Avg score"
          value={
            stats.averageScore === null ? "—" : Math.round(stats.averageScore)
          }
        />
        <AdminStatCard label="Resume uploads" value={stats.resumeUploads} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminLineChart title="Daily signups (14d)" data={charts.dailySignups} />
        <AdminBarChart title="Monthly growth" data={charts.monthlyGrowth} />
        <AdminLineChart
          title="Interview trend (14d)"
          data={charts.interviewTrend}
        />
        <AdminLineChart
          title="Average score trend"
          data={charts.averageScoreTrend}
          color="var(--chart-3)"
        />
        <AdminLineChart
          title="Resume usage"
          data={charts.resumeUsage}
          color="var(--chart-2)"
        />
        <AdminLineChart
          title="Company interview usage"
          data={charts.companyUsage}
          color="var(--chart-4)"
        />
        <AdminBarChart title="Top roles" data={charts.topRoles} />
        <AdminBarChart title="Top companies" data={charts.topCompanies} />
        <AdminBarChart
          title="Top technologies"
          data={charts.topTechnologies}
          color="var(--chart-1)"
        />
        <AdminPanel title="Most active users">
          <ul className="space-y-2 text-sm">
            {charts.mostActiveUsers.map((user) => (
              <li key={user.email} className="flex justify-between gap-3">
                <span className="truncate">
                  {user.name || user.email}
                  <span className="block text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {user.count}
                </span>
              </li>
            ))}
            {charts.mostActiveUsers.length === 0 ? (
              <li className="text-muted-foreground">No activity yet</li>
            ) : null}
          </ul>
        </AdminPanel>
      </div>

      <div className="mt-4">
        <AdminPanel
          title="Today’s digest preview"
          description="Same payload shape used by /api/cron/daily-digest."
        >
          <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">
            {JSON.stringify(digest, null, 2)}
          </pre>
        </AdminPanel>
      </div>
    </div>
  );
}
