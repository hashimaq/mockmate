import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  requireStaffProfile,
  requireSuperAdminProfile,
} from "@/services/rbac/rbac-service";
import type { PlatformGeneralSettings } from "@/types/database";

const DEFAULTS: PlatformGeneralSettings = {
  applicationName: "MockMate",
  supportEmail: "",
  notificationEmail: process.env.ADMIN_NOTIFICATION_EMAIL?.trim() ?? "",
  maintenanceMode: false,
};

export class AdminSettingsService {
  async getGeneral(): Promise<PlatformGeneralSettings> {
    await requireStaffProfile();
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "general")
        .maybeSingle();

      if (!data?.value) return { ...DEFAULTS };

      const value = data.value as Partial<PlatformGeneralSettings>;
      return {
        applicationName: value.applicationName ?? DEFAULTS.applicationName,
        supportEmail: value.supportEmail ?? DEFAULTS.supportEmail,
        notificationEmail:
          value.notificationEmail || DEFAULTS.notificationEmail,
        maintenanceMode: Boolean(value.maintenanceMode),
      };
    } catch {
      return { ...DEFAULTS };
    }
  }

  async updateGeneral(
    next: PlatformGeneralSettings,
  ): Promise<PlatformGeneralSettings> {
    const actor = await requireSuperAdminProfile();
    const admin = createServiceRoleClient();
    const { error } = await admin.from("platform_settings").upsert({
      key: "general",
      value: {
        applicationName: next.applicationName.trim() || "MockMate",
        supportEmail: next.supportEmail.trim(),
        notificationEmail: next.notificationEmail.trim(),
        maintenanceMode: next.maintenanceMode,
      },
      updated_at: new Date().toISOString(),
      updated_by: actor.id,
    });
    if (error) throw new Error(error.message);
    return this.getGeneral();
  }

  getEnvironmentStatus() {
    return {
      superAdminEmail: Boolean(process.env.SUPER_ADMIN_EMAIL?.trim()),
      superAdminPassword: Boolean(process.env.SUPER_ADMIN_PASSWORD?.trim()),
      resendApiKey: Boolean(process.env.RESEND_API_KEY?.trim()),
      adminNotificationEmail: Boolean(
        process.env.ADMIN_NOTIFICATION_EMAIL?.trim(),
      ),
      cronSecret: Boolean(process.env.CRON_SECRET?.trim()),
      geminiApiKey: Boolean(process.env.GEMINI_API_KEY?.trim()),
      serviceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
      siteUrl: Boolean(process.env.NEXT_PUBLIC_SITE_URL?.trim()),
    };
  }
}
