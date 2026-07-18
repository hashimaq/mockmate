"use server";

import { revalidatePath } from "next/cache";

import { AdminFeedbackService } from "@/services/admin/admin-feedback-service";
import { AdminNotificationService } from "@/services/admin/admin-notification-service";
import { AdminSettingsService } from "@/services/admin/admin-settings-service";
import type {
  AdminNotificationStatus,
  PlatformFeedbackStatus,
  PlatformGeneralSettings,
} from "@/types/database";

export type OpsActionResult = {
  success: boolean;
  error?: string;
  message?: string;
};

export async function setNotificationStatusAction(
  id: string,
  status: AdminNotificationStatus,
): Promise<OpsActionResult> {
  try {
    await new AdminNotificationService().setStatus(id, status);
    revalidatePath("/admin/notifications");
    revalidatePath("/admin");
    return { success: true, message: "Notification updated" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Update failed",
    };
  }
}

export async function markAllNotificationsReadAction(): Promise<OpsActionResult> {
  try {
    await new AdminNotificationService().markAllRead();
    revalidatePath("/admin/notifications");
    revalidatePath("/admin");
    return { success: true, message: "All marked as read" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Update failed",
    };
  }
}

export async function updateFeedbackStatusAction(
  id: string,
  status: PlatformFeedbackStatus,
  adminNotes?: string,
): Promise<OpsActionResult> {
  try {
    await new AdminFeedbackService().updateStatus(id, status, adminNotes);
    revalidatePath("/admin/feedback");
    return { success: true, message: "Feedback updated" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Update failed",
    };
  }
}

export async function updatePlatformSettingsAction(
  settings: PlatformGeneralSettings,
): Promise<OpsActionResult> {
  try {
    await new AdminSettingsService().updateGeneral(settings);
    revalidatePath("/admin/settings");
    return { success: true, message: "Settings saved" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Save failed",
    };
  }
}
