import { redirect } from "next/navigation";

import { AdminShell } from "@/features/admin/components/admin-shell";
import { getCurrentProfile, getSessionUser } from "@/services/auth";
import { AdminNotificationService } from "@/services/admin/admin-notification-service";
import { isStaffRole, syncOwnerSuperAdmin } from "@/services/rbac/rbac-service";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?next=/admin");
  }

  let profile = await getCurrentProfile();
  if (profile) {
    profile = await syncOwnerSuperAdmin(profile);
  }

  if (!profile || !isStaffRole(profile.role) || profile.status === "suspended") {
    redirect("/unauthorized");
  }

  let unreadNotifications = 0;
  try {
    unreadNotifications = await new AdminNotificationService().unreadCount();
  } catch {
    unreadNotifications = 0;
  }

  return (
    <AdminShell profile={profile} unreadNotifications={unreadNotifications}>
      {children}
    </AdminShell>
  );
}
