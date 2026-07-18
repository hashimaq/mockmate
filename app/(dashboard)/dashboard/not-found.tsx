import Link from "next/link";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/features/dashboard/components/dashboard-card";

export default function DashboardNotFound() {
  return (
    <DashboardCard className="mx-auto max-w-lg text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-primary">
        404
      </p>
      <h2 className="mt-2 text-xl font-semibold text-foreground">
        Page not found
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        This dashboard page doesn&apos;t exist.
      </p>
      <Button asChild className="mt-6">
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </DashboardCard>
  );
}
