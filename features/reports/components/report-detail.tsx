import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Lightbulb,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/features/dashboard/components/dashboard-card";
import { ReportCharts } from "@/features/reports/components/report-charts";
import { ReportProcessingView } from "@/features/reports/components/report-processing-view";
import {
  isReportReady,
  parseReportMetadata,
} from "@/services/reports/report-service";
import type { Interview, Report } from "@/types/database";

type ReportDetailProps = {
  interview: Interview;
  report: Report | null;
};

function scoreLabel(score: number | null): string {
  if (score === null || Number.isNaN(Number(score))) return "—";
  return `${Math.round(Number(score))}`;
}

export function ReportDetail({ interview, report }: ReportDetailProps) {
  if (!report || !isReportReady(report)) {
    return (
      <ReportProcessingView
        interviewId={interview.id}
        initialStatus={report?.status ?? "none"}
        initialError={report?.error_message}
        canRetry={interview.status === "completed"}
      />
    );
  }

  const metadata = parseReportMetadata(report.metadata);
  const skillData = [
    {
      skill: "Technical",
      score: metadata?.technicalScore ?? Number(report.overall_score ?? 0),
    },
    {
      skill: "Communication",
      score: metadata?.communicationScore ?? Number(report.overall_score ?? 0),
    },
    {
      skill: "Problem Solving",
      score: metadata?.problemSolvingScore ?? Number(report.overall_score ?? 0),
    },
  ];

  const questionChartData =
    metadata?.questionFeedback.map((item, index) => ({
      label: `Q${index + 1}`,
      score: item.score,
    })) ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Button asChild variant="ghost" className="-ml-2 mb-2">
            <Link href="/dashboard/reports">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Reports
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {interview.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {report.summary}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="secondary">
              Overall {scoreLabel(report.overall_score)}
            </Badge>
            {metadata?.model ? (
              <Badge variant="outline">{metadata.model}</Badge>
            ) : null}
            <Badge variant="outline">
              {new Date(report.created_at).toLocaleString()}
            </Badge>
          </div>
        </div>
        <DashboardCard className="min-w-[180px] text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Overall score
          </p>
          <p className="mt-2 text-5xl font-semibold tracking-tight text-primary">
            {scoreLabel(report.overall_score)}
          </p>
        </DashboardCard>
      </div>

      <ReportCharts skillData={skillData} questionData={questionChartData} />

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardCard>
          <div className="mb-3 flex items-center gap-2 text-foreground">
            <TrendingUp className="h-4 w-4 text-primary" aria-hidden />
            <h2 className="text-base font-semibold">Strengths</h2>
          </div>
          <FeedbackList
            items={report.strengths}
            empty="No strengths were recorded for this report."
          />
        </DashboardCard>
        <DashboardCard>
          <div className="mb-3 flex items-center gap-2 text-foreground">
            <TrendingDown className="h-4 w-4 text-primary" aria-hidden />
            <h2 className="text-base font-semibold">Weaknesses</h2>
          </div>
          <FeedbackList
            items={
              metadata?.weaknesses?.length
                ? metadata.weaknesses
                : report.improvements
            }
            empty="No weaknesses were recorded for this report."
          />
        </DashboardCard>
      </div>

      <DashboardCard>
        <div className="mb-3 flex items-center gap-2 text-foreground">
          <Target className="h-4 w-4 text-primary" aria-hidden />
          <h2 className="text-base font-semibold">
            Recommended learning plan
          </h2>
        </div>
        {metadata?.improvementPlan?.length ? (
          <ol className="space-y-3">
            {metadata.improvementPlan.map((item, index) => (
              <li key={`${item}-${index}`} className="flex gap-3 text-sm text-foreground">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                  {index + 1}
                </span>
                <span className="pt-1">{item}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">
            No improvement plan was stored. Regenerate the report to restore
            personalized next steps.
          </p>
        )}
      </DashboardCard>

      {metadata?.companyInsights ? (
        <DashboardCard>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-foreground">
              <Target className="h-4 w-4 text-primary" aria-hidden />
              <h2 className="text-base font-semibold">Company Readiness</h2>
            </div>
            <Badge variant="secondary">
              Readiness{" "}
              {Math.round(metadata.companyInsights.companyReadinessScore)}
            </Badge>
          </div>
          {interview.target_company ? (
            <p className="mb-4 text-sm text-muted-foreground">
              Target company: {interview.target_company}
            </p>
          ) : null}
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border/70 bg-background/40 p-3 text-center">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Hiring style match
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {metadata.companyInsights.hiringStyleMatch.length} signals
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-background/40 p-3 text-center">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Behavioral readiness
              </p>
              <p className="mt-1 text-2xl font-semibold text-primary">
                {Math.round(metadata.companyInsights.behavioralReadiness)}
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-background/40 p-3 text-center">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Technical readiness
              </p>
              <p className="mt-1 text-2xl font-semibold text-primary">
                {Math.round(metadata.companyInsights.technicalReadiness)}
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <InsightBlock
              title="Hiring style match"
              items={metadata.companyInsights.hiringStyleMatch}
            />
            <InsightBlock
              title="Recommended improvements for this company"
              items={metadata.companyInsights.recommendedImprovements}
            />
          </div>
          <div className="mt-4 rounded-xl border border-border/70 bg-background/40 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Suggested next interview
            </p>
            <p className="mt-2 text-sm text-foreground">
              {metadata.companyInsights.suggestedNextInterview}
            </p>
          </div>
        </DashboardCard>
      ) : null}

      {metadata?.resumeInsights ? (
        <DashboardCard>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-foreground">
              <FileText className="h-4 w-4 text-primary" aria-hidden />
              <h2 className="text-base font-semibold">Resume Alignment</h2>
            </div>
            {typeof metadata.resumeInsights.resumeCredibilityScore ===
            "number" ? (
              <Badge variant="secondary">
                Credibility{" "}
                {Math.round(metadata.resumeInsights.resumeCredibilityScore)}
              </Badge>
            ) : null}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <InsightBlock
              title="How well answers matched resume claims"
              items={metadata.resumeInsights.strongAlignment}
            />
            <InsightBlock
              title="Skills demonstrated successfully"
              items={
                metadata.resumeInsights.skillsDemonstratedSuccessfully?.length
                  ? metadata.resumeInsights.skillsDemonstratedSuccessfully
                  : metadata.resumeInsights.strongAlignment
              }
            />
            <InsightBlock
              title="Topics mentioned on resume but answered weakly"
              items={
                metadata.resumeInsights.topicsAnsweredWeakly?.length
                  ? metadata.resumeInsights.topicsAnsweredWeakly
                  : metadata.resumeInsights.knowledgeGaps
              }
            />
            <InsightBlock
              title="Skills requiring improvement"
              items={
                metadata.resumeInsights.skillsRequiringImprovement?.length
                  ? metadata.resumeInsights.skillsRequiringImprovement
                  : metadata.resumeInsights.resumeClaimsNeedingImprovement
              }
            />
          </div>
          <div className="mt-4">
            <InsightBlock
              title="Suggested learning path"
              items={
                metadata.resumeInsights.suggestedLearningPath?.length
                  ? metadata.resumeInsights.suggestedLearningPath
                  : metadata.resumeInsights.personalizedRecommendations
              }
            />
          </div>
        </DashboardCard>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-primary" aria-hidden />
          <h2 className="text-lg font-semibold text-foreground">
            Question-by-question feedback
          </h2>
        </div>
        <div className="space-y-3">
          {(metadata?.questionFeedback ?? []).map((item, index) => (
            <DashboardCard key={item.questionId}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                    Question {index + 1}
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {item.questionPrompt}
                  </p>
                </div>
                <Badge variant="secondary">{Math.round(item.score)}</Badge>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-border/70 bg-background/40 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Your answer
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
                    {item.answerContent.trim() || "(No answer provided)"}
                  </p>
                </div>
                <div className="rounded-xl border border-border/70 bg-background/40 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Better answer
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
                    {item.betterAnswer}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{item.feedback}</p>
            </DashboardCard>
          ))}
          {(metadata?.questionFeedback?.length ?? 0) === 0 ? (
            <DashboardCard>
              <p className="text-sm text-muted-foreground">
                Detailed question feedback was not stored for this report.
              </p>
            </DashboardCard>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function FeedbackList({
  items,
  empty,
}: {
  items: string[];
  empty: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{empty}</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li
          key={`${item}-${index}`}
          className="rounded-xl border border-border/70 bg-background/50 px-3 py-2 text-sm text-foreground"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function InsightBlock({
  title,
  items,
}: {
  title: string;
  items: string[] | undefined;
}) {
  const list = Array.isArray(items)
    ? items.filter((item): item is string => typeof item === "string")
    : [];

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <FeedbackList items={list} empty="No items recorded." />
    </div>
  );
}
