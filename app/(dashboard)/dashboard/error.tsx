"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/features/dashboard/components/dashboard-card";
import { captureException } from "@/lib/monitoring/logger";

type DashboardErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    captureException(error, {
      source: "dashboard/error",
      digest: error.digest,
    });
  }, [error]);

  return (
    <DashboardCard className="mx-auto max-w-lg text-center">
      <h2 className="text-xl font-semibold text-foreground">
        Something went wrong
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        We couldn&apos;t load this dashboard view. Try again or head back home.
      </p>
      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
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
