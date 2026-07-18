import { Skeleton } from "@/components/ui/skeleton";
import { DashboardCard } from "@/features/dashboard/components/dashboard-card";

export default function ReportsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="space-y-3">
        <DashboardCard>
          <Skeleton className="h-16 w-full" />
        </DashboardCard>
        <DashboardCard>
          <Skeleton className="h-16 w-full" />
        </DashboardCard>
      </div>
    </div>
  );
}
