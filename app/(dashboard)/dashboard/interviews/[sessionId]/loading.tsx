import { Skeleton } from "@/components/ui/skeleton";
import { DashboardCard } from "@/features/dashboard/components/dashboard-card";

export default function InterviewSessionLoading() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-56" />
      </div>
      <Skeleton className="h-2 w-full" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="space-y-5">
          <DashboardCard className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-20 w-full" />
          </DashboardCard>
          <DashboardCard className="space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-48 w-full" />
          </DashboardCard>
        </div>
        <DashboardCard className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <div className="grid grid-cols-3 gap-2">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
