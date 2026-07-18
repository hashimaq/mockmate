import { NextResponse } from "next/server";

import { resolvePostAuthPath } from "@/features/auth/lib/auth-utils";
import { createClient } from "@/lib/supabase/server";
import { notifyAdminEvent } from "@/services/notifications/admin-email-service";
import { syncOwnerSuperAdmin } from "@/services/rbac/rbac-service";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const { data: existing } = await supabase
        .from("profiles")
        .select("id, role, created_at")
        .eq("id", data.user.id)
        .maybeSingle();

      // Never overwrite role/status on existing profiles (prevents demoting staff)
      if (!existing) {
        await supabase.from("profiles").insert({
          id: data.user.id,
          email: data.user.email ?? "",
          full_name:
            (data.user.user_metadata?.full_name as string | undefined) ??
            (data.user.user_metadata?.name as string | undefined) ??
            null,
          avatar_url:
            (data.user.user_metadata?.avatar_url as string | undefined) ??
            (data.user.user_metadata?.picture as string | undefined) ??
            null,
          role: "user",
          status: "active",
        });
      } else {
        await supabase
          .from("profiles")
          .update({
            email: data.user.email ?? "",
            full_name:
              (data.user.user_metadata?.full_name as string | undefined) ??
              (data.user.user_metadata?.name as string | undefined) ??
              null,
            avatar_url:
              (data.user.user_metadata?.avatar_url as string | undefined) ??
              (data.user.user_metadata?.picture as string | undefined) ??
              null,
          })
          .eq("id", data.user.id);
      }

      const { data: profileRow } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .maybeSingle();

      const profile = profileRow
        ? await syncOwnerSuperAdmin(profileRow)
        : null;

      const ownerEmail = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
      const isOwner =
        !!ownerEmail &&
        (profile?.email?.trim().toLowerCase() === ownerEmail ||
          data.user.email?.trim().toLowerCase() === ownerEmail);

      const next = resolvePostAuthPath(
        isOwner ? "super_admin" : profile?.role,
        searchParams.get("next"),
      );

      if (!existing && profileRow?.created_at) {
        void notifyAdminEvent({
          type: "user_registered",
          userName: profile?.full_name,
          userEmail: profile?.email ?? data.user.email ?? "",
        });
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("Unable to complete authentication. The link may be expired.")}`,
  );
}
