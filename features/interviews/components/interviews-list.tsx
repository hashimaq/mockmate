import Link from "next/link";
import { ArrowRight, ClipboardList } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/features/dashboard/components/empty-state";
import { DashboardCard } from "@/features/dashboard/components/dashboard-card";
import { CompanyAvatar } from "@/features/companies/components/company-avatar";
import {
  formatDifficulty,
  formatExperienceLevel,
  formatInterviewType,
  formatStatus,
} from "@/features/interviews/lib/format";
import type { Interview } from "@/types/database";

type InterviewsListProps = {
  interviews: Interview[];
};

export function InterviewsList({ interviews }: InterviewsListProps) {
  if (interviews.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No interviews yet"
        description="Use the wizard above to create your first practice session. Questions come from the seed catalog until AI generation is connected."
      />
    );
  }

  return (
    <div className="space-y-3">
      {interviews.map((interview) => {
        const href = `/dashboard/interviews/${interview.id}`;
        const canResume = interview.status === "in_progress";

        return (
          <DashboardCard
            key={interview.id}
            className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {interview.target_company ? (
                  <CompanyAvatar
                    companyName={interview.target_company}
                    size="sm"
                  />
                ) : null}
                <h3 className="truncate text-base font-semibold text-foreground">
                  {interview.title}
                </h3>
                <Badge variant="secondary">{formatStatus(interview.status)}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {interview.target_company
                  ? `${interview.target_company} · `
                  : ""}
                {formatInterviewType(interview.interview_type)}
                {interview.role_target ? ` · ${interview.role_target}` : ""}
                {interview.experience_level
                  ? ` · ${formatExperienceLevel(interview.experience_level)}`
                  : ""}
                {` · ${formatDifficulty(interview.difficulty)}`}
                {interview.planned_duration_minutes
                  ? ` · ${interview.planned_duration_minutes} min`
                  : ""}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Created {new Date(interview.created_at).toLocaleString()}
              </p>
            </div>
            <Button asChild variant={canResume ? "default" : "outline"}>
              <Link href={href}>
                {canResume ? "Resume" : "View"}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </DashboardCard>
        );
      })}
    </div>
  );
}
