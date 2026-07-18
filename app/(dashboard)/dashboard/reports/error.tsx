"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/features/dashboard/components/dashboard-card";
import { captureException } from "@/lib/monitoring/logger";

type ReportsErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ReportsError({ error, reset }: ReportsErrorProps) {
  useEffect(() => {
    captureException(error, {
      source: "dashboard/reports/error",
      digest: error.digest,
    });
  }, [error]);

  return (
    <DashboardCard className="mx-auto max-w-lg text-center">
      <h2 className="text-xl font-semibold text-foreground">
        Couldn&apos;t load reports
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Please try again. Your interview data is safe.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button type="button" onClick={reset}>
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    </DashboardCard>
  );
}
