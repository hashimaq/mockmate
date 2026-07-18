"use client";

import dynamic from "next/dynamic";
import { BarChart3, Clock3 } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { ChartCard } from "@/features/dashboard/components/chart-card";
import { EmptyState } from "@/features/dashboard/components/empty-state";
import type {
  PerformancePoint,
  WeeklyPracticePoint,
} from "@/services/dashboard";

const WeeklyPracticeChart = dynamic(
  () =>
    import("@/features/dashboard/components/charts").then(
      (mod) => mod.WeeklyPracticeChart,
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full" />,
  },
);

const PerformanceTrendChart = dynamic(
  () =>
    import("@/features/dashboard/components/charts").then(
      (mod) => mod.PerformanceTrendChart,
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full" />,
  },
);

type DashboardChartsProps = {
  weekly: WeeklyPracticePoint[];
  performance: PerformancePoint[];
};

export function DashboardCharts({ weekly, performance }: DashboardChartsProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {weekly.length > 0 ? (
        <ChartCard
          title="Weekly Practice"
          description="Minutes practiced over the last 7 days"
        >
          <WeeklyPracticeChart data={weekly} />
        </ChartCard>
      ) : (
        <EmptyState
          icon={Clock3}
          title="No practice this week"
          description="Complete an interview to see your weekly practice chart."
          actionLabel="Start Your First Interview"
          actionHref="/dashboard/interviews"
          className="min-h-[320px]"
        />
      )}

      {performance.length > 0 ? (
        <ChartCard
          title="Performance Trend"
          description="Average score by week from your completed sessions"
        >
          <PerformanceTrendChart data={performance} />
        </ChartCard>
      ) : (
        <EmptyState
          icon={BarChart3}
          title="No scored sessions yet"
          description="Finish interviews with scores to unlock your performance trend."
          actionLabel="Start Your First Interview"
          actionHref="/dashboard/interviews"
          className="min-h-[320px]"
        />
      )}
    </div>
  );
}
