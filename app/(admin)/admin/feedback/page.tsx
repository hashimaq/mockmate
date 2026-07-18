import type { Metadata } from "next";

import { AdminFeedbackClient } from "@/features/admin/components/admin-feedback-client";
import { AdminPageHeader } from "@/features/admin/components/admin-ui";
import { AdminFeedbackService } from "@/services/admin/admin-feedback-service";
import { requireStaffProfile } from "@/services/rbac/rbac-service";
import type {
  PlatformFeedbackCategory,
  PlatformFeedbackStatus,
} from "@/types/database";

export const metadata: Metadata = {
  title: "Admin Feedback",
};

type SearchParams = Promise<{
  q?: string;
  category?: string;
  status?: string;
  page?: string;
}>;

export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireStaffProfile();
  const params = await searchParams;
  const result = await new AdminFeedbackService().list({
    search: params.q,
    category:
      (params.category as PlatformFeedbackCategory | "all" | undefined) ??
      "all",
    status:
      (params.status as PlatformFeedbackStatus | "all" | undefined) ?? "all",
    page: Number(params.page ?? "1") || 1,
  });

  return (
    <div>
      <AdminPageHeader
        title="Feedback center"
        description="Manage contact messages, feature requests, bug reports, and user feedback."
      />
      <AdminFeedbackClient
        items={result.items}
        total={result.total}
        search={params.q ?? ""}
        category={params.category ?? "all"}
        status={params.status ?? "all"}
      />
    </div>
  );
}
