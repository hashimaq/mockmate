import type { Metadata } from "next";

import { AdminNotificationsClient } from "@/features/admin/components/admin-notifications-client";
import { AdminPageHeader } from "@/features/admin/components/admin-ui";
import { AdminNotificationService } from "@/services/admin/admin-notification-service";
import { requireStaffProfile } from "@/services/rbac/rbac-service";
import type { AdminNotificationStatus } from "@/types/database";

export const metadata: Metadata = {
  title: "Admin Notifications",
};

type SearchParams = Promise<{
  q?: string;
  status?: string;
  type?: string;
  page?: string;
}>;

export default async function AdminNotificationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireStaffProfile();
  const params = await searchParams;
  const result = await new AdminNotificationService().list({
    search: params.q,
    status: (params.status as AdminNotificationStatus | "all" | undefined) ?? "all",
    eventType: params.type ?? "all",
    page: Number(params.page ?? "1") || 1,
  });

  return (
    <div>
      <AdminPageHeader
        title="Notification center"
        description="In-app platform alerts for registrations, resumes, interviews, reports, and errors."
      />
      <AdminNotificationsClient
        items={result.items}
        total={result.total}
        unreadCount={result.unreadCount}
        search={params.q ?? ""}
        status={params.status ?? "all"}
        eventType={params.type ?? "all"}
        page={result.page}
        pageSize={result.pageSize}
      />
    </div>
  );
}
