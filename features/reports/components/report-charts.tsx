"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";
import { ChartCard } from "@/features/dashboard/components/chart-card";

const SkillBreakdownChart = dynamic(
  () =>
    import("@/features/reports/components/skill-breakdown-chart").then(
      (mod) => mod.SkillBreakdownChart,
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full" />,
  },
);

const QuestionScoresChart = dynamic(
  () =>
    import("@/features/reports/components/question-scores-chart").then(
      (mod) => mod.QuestionScoresChart,
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full" />,
  },
);

type ReportChartsProps = {
  skillData: Array<{ skill: string; score: number }>;
  questionData: Array<{ label: string; score: number }>;
};

export function ReportCharts({ skillData, questionData }: ReportChartsProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <ChartCard
        title="Skill breakdown"
        description="Technical, communication, and problem-solving scores"
      >
        <SkillBreakdownChart data={skillData} />
      </ChartCard>
      <ChartCard
        title="Question scores"
        description="Per-question performance across the session"
      >
        {questionData.length > 0 ? (
          <QuestionScoresChart data={questionData} />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No per-question scores available.
          </div>
        )}
      </ChartCard>
    </div>
  );
}
