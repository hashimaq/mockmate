import { BarChart3 } from "lucide-react";

import { EmptyState } from "@/features/dashboard/components/empty-state";

export default function ReportNotFound() {
  return (
    <EmptyState
      icon={BarChart3}
      title="Report not found"
      description="This report does not exist or you do not have access to it."
      actionLabel="Back to reports"
      actionHref="/dashboard/reports"
    />
  );
}
