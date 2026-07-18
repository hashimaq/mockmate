import { ClipboardList } from "lucide-react";

import { EmptyState } from "@/features/dashboard/components/empty-state";

export default function InterviewNotFound() {
  return (
    <EmptyState
      icon={ClipboardList}
      title="Interview not found"
      description="This session does not exist or you do not have access to it."
      actionLabel="Back to interviews"
      actionHref="/dashboard/interviews"
    />
  );
}
