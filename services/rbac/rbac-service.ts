import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import {
  getHomePathForRole,
  isStaffRole,
  isSuperAdmin,
  type UserRole,
} from "@/services/rbac/roles";
import type { Profile } from "@/types/database";

function getSuperAdminEmail(): string | null {
  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  return email || null;
}

/**
 * Ensure SUPER_ADMIN_EMAIL owns super_admin role.
 * Never downgrades an existing super_admin.
 */
export async function syncOwnerSuperAdmin(
  profile: Profile,
): Promise<Profile> {
  const ownerEmail = getSuperAdminEmail();
  if (!ownerEmail) return profile;

  const email = profile.email.trim().toLowerCase();
  if (email !== ownerEmail) return profile;

  if (profile.role === "super_admin") return profile;

  // Only auto-promote from user (or missing). Never demote admins incorrectly —
  // owner email always becomes super_admin.
  try {
    const admin = createServiceRoleClient();
    const { data, error } = await admin
      .from("profiles")
      .update({ role: "super_admin", status: "active" })
      .eq("id", profile.id)
      .select("*")
      .single();

    if (error || !data) return profile;
    return data;
  } catch {
    return profile;
  }
}

export async function getProfileByUserId(
  userId: string,
): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return syncOwnerSuperAdmin(data);
}

export async function requireStaffProfile(): Promise<Profile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  const profile = await getProfileByUserId(user.id);
  if (!profile || !isStaffRole(profile.role)) {
    throw new Error("FORBIDDEN");
  }
  if (profile.status === "suspended") {
    throw new Error("SUSPENDED");
  }

  return profile;
}

export async function requireSuperAdminProfile(): Promise<Profile> {
  const profile = await requireStaffProfile();
  if (!isSuperAdmin(profile.role)) {
    throw new Error("FORBIDDEN");
  }
  return profile;
}

export function homePathForProfile(profile: Profile | null): string {
  return getHomePathForRole(profile?.role as UserRole | undefined);
}

export { isStaffRole, isSuperAdmin, getHomePathForRole };
