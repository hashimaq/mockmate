"use server";

import { revalidatePath } from "next/cache";

import { toSafeClientError } from "@/lib/security/action-validation";
import { AdminUserService } from "@/services/admin/admin-user-service";
import type { AccountStatus, UserRole } from "@/types/database";

export type AdminActionResult = {
  success: boolean;
  error?: string;
  message?: string;
};

export async function suspendUserAction(
  userId: string,
): Promise<AdminActionResult> {
  try {
    await new AdminUserService().setStatus(userId, "suspended");
    revalidatePath("/admin/users");
    return { success: true, message: "User suspended." };
  } catch (error) {
    return {
      success: false,
      error: toSafeClientError(error, "Failed to suspend user"),
    };
  }
}

export async function reactivateUserAction(
  userId: string,
): Promise<AdminActionResult> {
  try {
    await new AdminUserService().setStatus(userId, "active");
    revalidatePath("/admin/users");
    return { success: true, message: "User reactivated." };
  } catch (error) {
    return {
      success: false,
      error: toSafeClientError(error, "Failed to reactivate user"),
    };
  }
}

export async function deleteUserAction(
  userId: string,
): Promise<AdminActionResult> {
  try {
    await new AdminUserService().deleteUser(userId);
    revalidatePath("/admin/users");
    return { success: true, message: "User deleted." };
  } catch (error) {
    return {
      success: false,
      error: toSafeClientError(error, "Failed to delete user"),
    };
  }
}

export async function setUserRoleAction(
  userId: string,
  role: Exclude<UserRole, "super_admin">,
): Promise<AdminActionResult> {
  try {
    await new AdminUserService().setRole(userId, role);
    revalidatePath("/admin/users");
    return { success: true, message: `Role updated to ${role}.` };
  } catch (error) {
    return {
      success: false,
      error: toSafeClientError(error, "Failed to update role"),
    };
  }
}

export async function setUserStatusAction(
  userId: string,
  status: AccountStatus,
): Promise<AdminActionResult> {
  try {
    await new AdminUserService().setStatus(userId, status);
    revalidatePath("/admin/users");
    return { success: true, message: `Status updated to ${status}.` };
  } catch (error) {
    return {
      success: false,
      error: toSafeClientError(error, "Failed to update status"),
    };
  }
}
