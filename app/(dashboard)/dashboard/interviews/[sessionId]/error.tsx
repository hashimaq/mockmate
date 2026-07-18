"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/features/dashboard/components/dashboard-card";
import { captureException } from "@/lib/monitoring/logger";

type InterviewSessionErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function InterviewSessionError({
  error,
  reset,
}: InterviewSessionErrorProps) {
  useEffect(() => {
    captureException(error, {
      source: "dashboard/interviews/[sessionId]/error",
      digest: error.digest,
    });
  }, [error]);

  return (
    <DashboardCard className="mx-auto max-w-lg text-center">
      <h2 className="text-xl font-semibold text-foreground">
        Something went wrong
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        We could not load this interview session. Try again, or return to your
        interviews list.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="outline">
          <Link href="/dashboard/interviews">Back to interviews</Link>
        </Button>
      </div>
    </DashboardCard>
  );
}
