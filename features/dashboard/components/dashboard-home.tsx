import Link from "next/link";
import {
  Activity,
  ArrowRight,
  ClipboardList,
  Clock3,
  Flame,
  Sparkles,
  Target,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/features/dashboard/components/dashboard-card";
import { DashboardCharts } from "@/features/dashboard/components/dashboard-charts";
import { EmptyState } from "@/features/dashboard/components/empty-state";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { SectionHeader } from "@/features/dashboard/components/section-header";
import { StatCard } from "@/features/dashboard/components/stat-card";
import {
  formatDuration,
  formatScore,
  type DashboardOverview,
} from "@/services/dashboard";

type DashboardHomeProps = {
  overview: DashboardOverview;
  displayName: string;
};

export function DashboardHome({ overview, displayName }: DashboardHomeProps) {
  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${displayName}`}
        description="Track your practice, review progress, and keep your interview streak alive."
        action={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <Button asChild>
              <Link href="/dashboard/interviews">
                Start interview
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild variant="outline" className="relative">
              <Link
                href="/dashboard/interviews?mode=resume"
                aria-label="Resume Interview — Personalized"
              >
                Resume Interview
                <span className="ms-1 inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  <Sparkles className="h-3 w-3" aria-hidden />
                  Personalized
                </span>
              </Link>
            </Button>
          </div>
        }
      />

      {!overview.hasInterviews ? (
        <DashboardCard className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-chart-2/10">
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Badge className="mb-3">Get started</Badge>
              <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                Ready for your first mock interview?
              </h2>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                Your dashboard fills in with real stats, charts, and history as
                soon as you complete a session.
              </p>
            </div>
            <Button asChild size="lg" className="shrink-0">
              <Link href="/dashboard/interviews">
                <Sparkles className="h-4 w-4" aria-hidden />
                Start Your First Interview
              </Link>
            </Button>
          </div>
        </DashboardCard>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Interviews"
          value={String(overview.totalInterviews)}
          hint="All time"
          icon={ClipboardList}
        />
        <StatCard
          label="Average Score"
          value={formatScore(overview.averageScore)}
          hint="Completed sessions"
          icon={Target}
        />
        <StatCard
          label="Practice Time"
          value={formatDuration(overview.practiceSeconds)}
          hint="Logged practice"
          icon={Clock3}
        />
        <StatCard
          label="Current Streak"
          value={`${overview.currentStreak} day${overview.currentStreak === 1 ? "" : "s"}`}
          hint="Keep it going"
          icon={Flame}
        />
      </div>

      <DashboardCharts
        weekly={overview.weeklyPractice}
        performance={overview.performanceTrend}
      />

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div>
          <SectionHeader
            title="Recent Interviews"
            description="Your latest practice sessions"
            action={
              overview.recentInterviews.length > 0 ? (
                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard/history">View history</Link>
                </Button>
              ) : undefined
            }
          />
          {overview.recentInterviews.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No interviews yet"
              description="Start your first mock interview to see history, scores, and progress here."
              actionLabel="Start Your First Interview"
              actionHref="/dashboard/interviews"
            />
          ) : (
            <DashboardCard padding="none" className="divide-y divide-border/70">
              {overview.recentInterviews.map((interview) => (
                <div
                  key={interview.id}
                  className="flex items-center justify-between gap-3 px-5 py-4 sm:px-6"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {interview.title}
                    </p>
                    <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                      {interview.interview_type} ·{" "}
                      {interview.status.replace("_", " ")}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {interview.score !== null
                      ? `${Math.round(Number(interview.score))}%`
                      : "—"}
                  </Badge>
                </div>
              ))}
            </DashboardCard>
          )}
        </div>

        <div>
          <SectionHeader
            title="Latest Activity"
            description="Recent account events"
          />
          {overview.recentActivity.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No activity yet"
              description="When you practice interviews, activity will show up here."
              actionLabel="Start Your First Interview"
              actionHref="/dashboard/interviews"
            />
          ) : (
            <DashboardCard padding="none" className="divide-y divide-border/70">
              {overview.recentActivity.map((item) => (
                <div key={item.id} className="px-5 py-4 sm:px-6">
                  <p className="text-sm font-medium text-foreground">
                    {item.action}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {item.description ??
                      new Date(item.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </DashboardCard>
          )}
        </div>
      </div>
    </div>
  );
}
