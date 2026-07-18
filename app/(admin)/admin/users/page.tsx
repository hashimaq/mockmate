import type { Metadata } from "next";

import { AdminUsersTable } from "@/features/admin/components/admin-users-table";
import { AdminPageHeader } from "@/features/admin/components/admin-ui";
import { AdminUserService } from "@/services/admin/admin-user-service";
import { requireStaffProfile } from "@/services/rbac/rbac-service";
import type { AccountStatus, UserRole } from "@/types/database";

export const metadata: Metadata = {
  title: "Admin Users",
};

type SearchParams = Promise<{
  q?: string;
  role?: string;
  status?: string;
  page?: string;
}>;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const actor = await requireStaffProfile();
  const params = await searchParams;
  const result = await new AdminUserService().listUsers({
    search: params.q,
    role: (params.role as UserRole | "all" | undefined) ?? "all",
    status: (params.status as AccountStatus | "all" | undefined) ?? "all",
    page: Number(params.page ?? "1") || 1,
  });

  return (
    <div>
      <AdminPageHeader
        title="User management"
        description="Search, filter, and govern every account on the platform."
      />
      <AdminUsersTable
        users={result.users}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        actor={actor}
        search={params.q ?? ""}
        role={params.role ?? "all"}
        status={params.status ?? "all"}
      />
    </div>
  );
}
