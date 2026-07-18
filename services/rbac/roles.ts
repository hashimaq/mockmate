export type UserRole = "super_admin" | "admin" | "user";
export type AccountStatus = "active" | "suspended";

export const USER_ROLES = ["super_admin", "admin", "user"] as const;
export const ACCOUNT_STATUSES = ["active", "suspended"] as const;

export function isStaffRole(role: UserRole | string | null | undefined): boolean {
  return role === "super_admin" || role === "admin";
}

export function isSuperAdmin(
  role: UserRole | string | null | undefined,
): boolean {
  return role === "super_admin";
}

export function getHomePathForRole(
  role: UserRole | string | null | undefined,
): string {
  if (isStaffRole(role)) return "/admin";
  return "/dashboard";
}
