import Link from "next/link";
import { FileText, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/features/dashboard/components/dashboard-card";

export function ResumeRequiredCard() {
  return (
    <DashboardCard
      className="border-primary/20 bg-gradient-to-br from-primary/[0.06] via-card to-emerald-500/[0.05]"
      role="status"
      aria-labelledby="resume-required-title"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileText className="h-5 w-5" aria-hidden />
          </div>
          <h2
            id="resume-required-title"
            className="text-lg font-semibold text-foreground sm:text-xl"
          >
            Resume Required
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Upload and analyze your resume to unlock personalized AI interviews
            tailored to your experience, projects and technical skills.
          </p>
        </div>
        <Button asChild size="lg" className="shrink-0">
          <Link href="#resume-upload">
            <Sparkles className="h-4 w-4" aria-hidden />
            Upload Resume
          </Link>
        </Button>
      </div>
    </DashboardCard>
  );
}
