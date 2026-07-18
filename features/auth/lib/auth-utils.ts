import { isStaffRole } from "@/services/rbac/roles";

/**
 * Maps Supabase Auth errors to user-friendly messages.
 */
export function mapAuthError(error: { message?: string; code?: string } | null): string {
  if (!error?.message) {
    return "Something went wrong. Please try again.";
  }

  const message = error.message.toLowerCase();
  const code = error.code?.toLowerCase() ?? "";

  if (
    message.includes("invalid login credentials") ||
    message.includes("invalid credentials") ||
    code === "invalid_credentials"
  ) {
    return "Incorrect email or password.";
  }

  if (message.includes("email not confirmed") || code === "email_not_confirmed") {
    return "Please verify your email before signing in.";
  }

  if (
    message.includes("user already registered") ||
    message.includes("already been registered") ||
    code === "user_already_exists"
  ) {
    return "An account with this email already exists.";
  }

  if (message.includes("password") && message.includes("weak")) {
    return "Password is too weak. Use at least 8 characters with mixed case and a number.";
  }

  if (
    message.includes("expired") ||
    message.includes("otp_expired") ||
    code === "otp_expired"
  ) {
    return "This link has expired. Please request a new one.";
  }

  if (message.includes("same password")) {
    return "New password must be different from your current password.";
  }

  if (message.includes("network") || message.includes("fetch")) {
    return "Network error. Check your connection and try again.";
  }

  if (
    message.includes("rate limit") ||
    message.includes("too many") ||
    message.includes("security purposes") ||
    code === "over_request_rate_limit" ||
    code === "over_email_send_rate_limit"
  ) {
    return "Too many attempts for security. Please wait about a minute, then try again.";
  }

  return error.message;
}

/** Collect first Zod issue per field for inline form errors. */
export function zodFieldErrors(
  error: { issues: Array<{ path: PropertyKey[]; message: string }> },
): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !fields[key]) {
      fields[key] = issue.message;
    }
  }
  return fields;
}

export const REMEMBER_ME_COOKIE = "mm_remember_me";
export const PROTECTED_PATH_PREFIXES = [
  "/dashboard",
  "/settings",
  "/admin",
] as const;

export const AUTH_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
] as const;

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function isUserAppPath(pathname: string): boolean {
  return (
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/settings" ||
    pathname.startsWith("/settings/")
  );
}

export function getSafeRedirectPath(
  path: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return fallback;
  }
  if (isAuthRoute(path)) {
    return fallback;
  }
  return path;
}

/**
 * Role-aware post-login destination.
 * Staff always land in /admin unless `next` is already a safe admin path.
 * Users never land in /admin.
 */
export function resolvePostAuthPath(
  role: string | null | undefined,
  requestedNext?: string | null,
): string {
  const home = isStaffRole(role) ? "/admin" : "/dashboard";
  const requested = getSafeRedirectPath(requestedNext, home);

  if (isStaffRole(role)) {
    return isAdminPath(requested) ? requested : home;
  }

  return isAdminPath(requested) ? home : requested;
}
