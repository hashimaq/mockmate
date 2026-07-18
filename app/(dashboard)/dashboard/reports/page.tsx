import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BarChart3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/features/dashboard/components/empty-state";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { DashboardCard } from "@/features/dashboard/components/dashboard-card";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/services/auth";
import { InterviewService } from "@/services/interviews/interview-service";
import { ReportService } from "@/services/reports/report-service";

export const metadata: Metadata = {
  title: "Reports",
};

export default async function ReportsPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?next=/dashboard/reports");
  }

  const supabase = await createClient();
  const reports = await new ReportService(supabase).listForUser(user.id);
  const interviews = await new InterviewService(supabase).listTitlesForUser(
    user.id,
  );
  const interviewById = new Map(interviews.map((item) => [item.id, item]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="AI coaching reports with score breakdowns, strengths, and personalized improvement plans."
      />

      {reports.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No reports yet"
          description="Finish an interview to unlock structured Gemini feedback and score breakdowns."
          actionLabel="Start Your First Interview"
          actionHref="/dashboard/interviews"
        />
      ) : (
        <div className="grid gap-3">
          {reports.map((report) => {
            const interview = interviewById.get(report.interview_id);
            return (
              <DashboardCard
                key={report.id}
                className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-base font-semibold text-foreground">
                      {interview?.title ?? "Interview report"}
                    </h3>
                    <Badge variant="secondary">
                      {report.status === "completed" &&
                      report.overall_score !== null
                        ? `${Math.round(Number(report.overall_score))}`
                        : report.status}
                    </Badge>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {report.status === "completed"
                      ? (report.summary ?? "AI evaluation report")
                      : report.status === "failed"
                        ? (report.error_message ??
                          "Report generation failed — retry from the report page.")
                        : "AI report is being generated…"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(report.created_at).toLocaleString()}
                  </p>
                </div>
                <Button asChild>
                  <Link href={`/dashboard/reports/${report.interview_id}`}>
                    {report.status === "completed"
                      ? "View report"
                      : report.status === "failed"
                        ? "Retry report"
                        : "View progress"}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </Button>
              </DashboardCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
