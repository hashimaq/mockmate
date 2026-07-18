import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import {
  isAdminPath,
  isAuthRoute,
  isProtectedPath,
  REMEMBER_ME_COOKIE,
  resolvePostAuthPath,
} from "@/features/auth/lib/auth-utils";
import { isStaffRole } from "@/services/rbac/roles";
import type { Database } from "@/types/database";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Fail closed for protected routes when auth infra is misconfigured
  if (!url || !anonKey) {
    if (isProtectedPath(request.nextUrl.pathname)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("next", request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          const remember =
            request.cookies.get(REMEMBER_ME_COOKIE)?.value !== "0";
          supabaseResponse.cookies.set(name, value, {
            ...options,
            ...(remember
              ? {}
              : {
                  maxAge: undefined,
                }),
          });
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && isProtectedPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isAuthRoute(pathname)) {
    // Allow reset-password while recovering (user may already have a session from the link)
    if (pathname === "/reset-password") {
      return supabaseResponse;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, email")
      .eq("id", user.id)
      .maybeSingle();

    const safeNext = resolvePostAuthPath(
      profile?.role,
      request.nextUrl.searchParams.get("next"),
    );

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = safeNext;
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  // Server-side RBAC for admin routes
  if (user && isAdminPath(pathname)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .maybeSingle();

    if (
      !profile ||
      !isStaffRole(profile.role) ||
      profile.status === "suspended"
    ) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/unauthorized";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return supabaseResponse;
}
