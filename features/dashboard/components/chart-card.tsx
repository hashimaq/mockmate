import type { ReactNode } from "react";

import { DashboardCard } from "@/features/dashboard/components/dashboard-card";
import { cn } from "@/lib/utils";

type ChartCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function ChartCard({
  title,
  description,
  children,
  className,
}: ChartCardProps) {
  return (
    <DashboardCard className={cn("min-h-[320px]", className)}>
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="h-56 w-full">{children}</div>
    </DashboardCard>
  );
}
