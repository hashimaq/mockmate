import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { resolvePostAuthPath } from "@/features/auth/lib/auth-utils";
import { notifyAdminEvent } from "@/services/notifications/admin-email-service";
import { syncOwnerSuperAdmin } from "@/services/rbac/rbac-service";
import type { Database } from "@/types/database";

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

function getRedirectOrigin(request: Request): string {
  const { origin } = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";

  if (process.env.NODE_ENV !== "development" && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`.replace(/\/$/, "");
  }

  return origin.replace(/\/$/, "");
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const { searchParams } = requestUrl;
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next");
  const origin = getRedirectOrigin(request);

  const loginError = (message: string) =>
    NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(message)}`,
    );

  if (!code) {
    return loginError(
      "Unable to complete authentication. The link may be expired.",
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return loginError("Auth is not configured. Contact support.");
  }

  const cookieStore = await cookies();
  // Buffer cookies so we can attach them to the final redirect (Next 15+
  // does not always propagate cookies().set onto NextResponse.redirect).
  const cookieBuffer: CookieToSet[] = [];

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          try {
            cookieStore.set(name, value, options);
          } catch {
            // ignore — response buffer still carries the session
          }
          cookieBuffer.push({ name, value, options });
        });
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return loginError(
      "Unable to complete authentication. The link may be expired.",
    );
  }

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
    requestedNext,
  );

  if (!existing && profileRow?.created_at) {
    void notifyAdminEvent({
      type: "user_registered",
      userName: profile?.full_name,
      userEmail: profile?.email ?? data.user.email ?? "",
    });
  }

  const response = NextResponse.redirect(`${origin}${next}`);
  cookieBuffer.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });
  return response;
}
