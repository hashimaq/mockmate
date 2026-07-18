import { createClient } from "@/lib/supabase/server";
import { syncOwnerSuperAdmin } from "@/services/rbac/rbac-service";
import type { Profile } from "@/types/database";

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const user = await getSessionUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return null;
  }

  if (data) {
    return syncOwnerSuperAdmin(data);
  }

  // Fallback if trigger hasn't run yet — insert only (never overwrite role)
  const { data: inserted, error: insertError } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email ?? "",
      full_name:
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        null,
      avatar_url:
        (user.user_metadata?.avatar_url as string | undefined) ??
        (user.user_metadata?.picture as string | undefined) ??
        null,
      role: "user",
      status: "active",
    })
    .select("*")
    .single();

  if (!insertError && inserted) {
    return syncOwnerSuperAdmin(inserted);
  }

  // Race: row created by trigger — re-read without clobbering role
  const { data: retry } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!retry) return null;
  return syncOwnerSuperAdmin(retry);
}
