"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { History } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CompanyAvatar } from "@/features/companies/components/company-avatar";
import { DashboardCard } from "@/features/dashboard/components/dashboard-card";
import { EmptyState } from "@/features/dashboard/components/empty-state";
import {
  formatDifficulty,
  formatInterviewType,
} from "@/features/interviews/lib/format";
import type { Interview } from "@/types/database";

type HistoryListProps = {
  interviews: Interview[];
};

export function HistoryList({ interviews }: HistoryListProps) {
  const [companyFilter, setCompanyFilter] = useState("all");

  const companies = useMemo(() => {
    const names = new Set<string>();
    for (const interview of interviews) {
      if (interview.target_company?.trim()) {
        names.add(interview.target_company.trim());
      }
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [interviews]);

  const filtered = useMemo(() => {
    if (companyFilter === "all") return interviews;
    if (companyFilter === "none") {
      return interviews.filter((item) => !item.target_company);
    }
    return interviews.filter(
      (item) => item.target_company === companyFilter,
    );
  }, [companyFilter, interviews]);

  if (interviews.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="No history yet"
        description="Completed interviews will appear here with scores and timestamps."
        actionLabel="Start Your First Interview"
        actionHref="/dashboard/interviews"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Label htmlFor="history-company-filter">Filter by company</Label>
          <select
            id="history-company-filter"
            className="flex h-11 w-full min-w-[220px] rounded-xl border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto"
            value={companyFilter}
            onChange={(event) => setCompanyFilter(event.target.value)}
            aria-label="Filter interview history by company"
          >
            <option value="all">All companies</option>
            <option value="none">No company</option>
            {companies.map((company) => (
              <option key={company} value={company}>
                {company}
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} of {interviews.length}
        </p>
      </div>

      {filtered.length === 0 ? (
        <DashboardCard>
          <p className="text-sm text-muted-foreground">
            No interviews match this company filter.
          </p>
        </DashboardCard>
      ) : (
        <DashboardCard padding="none" className="divide-y divide-border/70">
          {filtered.map((interview) => (
            <div
              key={interview.id}
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
            >
              <div className="flex min-w-0 items-start gap-3">
                {interview.target_company ? (
                  <CompanyAvatar
                    companyName={interview.target_company}
                    size="sm"
                  />
                ) : null}
                <div className="min-w-0">
                  <p className="font-medium text-foreground">
                    {interview.role_target ?? interview.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {interview.target_company
                      ? `${interview.target_company} · `
                      : ""}
                    {formatInterviewType(interview.interview_type)}
                    {` · ${formatDifficulty(interview.difficulty)}`}
                    {` · ${new Date(interview.created_at).toLocaleString()}`}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  {interview.score !== null
                    ? `${Math.round(Number(interview.score))}%`
                    : "No score"}
                </Badge>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/dashboard/interviews/${interview.id}`}>
                    View
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </DashboardCard>
      )}
    </div>
  );
}
