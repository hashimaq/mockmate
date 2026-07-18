import { Skeleton } from "@/components/ui/skeleton";
import { DashboardCard } from "@/features/dashboard/components/dashboard-card";

export default function ReportLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <DashboardCard className="h-[320px]">
          <Skeleton className="h-full w-full" />
        </DashboardCard>
        <DashboardCard className="h-[320px]">
          <Skeleton className="h-full w-full" />
        </DashboardCard>
      </div>
    </div>
  );
}
