import type { Metadata } from "next";

import { AdminSettingsForm } from "@/features/admin/components/admin-settings-form";
import { AdminPageHeader } from "@/features/admin/components/admin-ui";
import { AdminSettingsService } from "@/services/admin/admin-settings-service";
import { requireStaffProfile } from "@/services/rbac/rbac-service";
import { isSuperAdmin } from "@/services/rbac/roles";

export const metadata: Metadata = {
  title: "Admin Settings",
};

export default async function AdminSettingsPage() {
  const profile = await requireStaffProfile();
  const settingsService = new AdminSettingsService();
  const [general, environment] = await Promise.all([
    settingsService.getGeneral(),
    Promise.resolve(settingsService.getEnvironmentStatus()),
  ]);

  return (
    <div>
      <AdminPageHeader
        title="Platform settings"
        description="Owner-level configuration for MockMate as a product — not personal user settings."
      />
      <AdminSettingsForm
        initial={general}
        canEdit={isSuperAdmin(profile.role)}
        environment={environment}
      />
    </div>
  );
}
