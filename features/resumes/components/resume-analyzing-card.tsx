"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/features/dashboard/components/dashboard-card";
import { getResumeStatusAction } from "@/features/resumes/actions/resume-actions";
import { RESUME_BASED_INTERVIEW_HREF } from "@/features/resumes/lib/resume-interview-defaults";

type ResumeAnalyzingCardProps = {
  errorMessage?: string | null;
  variant?: "processing" | "failed";
};

export function ResumeAnalyzingCard({
  errorMessage,
  variant = "processing",
}: ResumeAnalyzingCardProps) {
  const router = useRouter();

  useEffect(() => {
    if (variant !== "processing") return;

    let cancelled = false;
    const tick = async () => {
      const result = await getResumeStatusAction();
      if (cancelled || !result.success) return;
      if (result.status === "completed") {
        router.replace(RESUME_BASED_INTERVIEW_HREF);
        router.refresh();
        return;
      }
      if (result.status === "failed") {
        router.refresh();
      }
    };

    void tick();
    const id = setInterval(() => {
      void tick();
    }, 2500);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [router, variant]);

  if (variant === "failed") {
    return (
      <DashboardCard className="border-destructive/20">
        <h2 className="text-lg font-semibold text-foreground">
          Resume analysis failed
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {errorMessage?.trim() ||
            "We could not prepare a personalized interview from this resume. Retry analysis or upload a new file."}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/dashboard/resume">Open Resume</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/interviews">Standard Interview</Link>
          </Button>
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard className="border-primary/20 bg-gradient-to-br from-primary/[0.05] via-card to-card">
      <div className="flex items-start gap-3">
        <Loader2
          className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-primary"
          aria-hidden
        />
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Analyzing Resume...
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Please wait while AI prepares your personalized interview.
          </p>
          <p className="mt-3 text-xs text-muted-foreground" aria-live="polite">
            This page refreshes automatically when analysis completes.
          </p>
        </div>
      </div>
    </DashboardCard>
  );
}
