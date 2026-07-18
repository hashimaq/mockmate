import { isStaffRole } from "@/services/rbac/roles";

/** Always return a human-readable string (never `{}` / empty objects). */
export function toErrorMessage(error: unknown, fallback: string): string {
  if (error == null) return fallback;

  if (typeof error === "string") {
    const trimmed = error.trim();
    if (!trimmed || trimmed === "{}" || trimmed === "[object Object]") {
      return fallback;
    }
    return trimmed;
  }

  if (typeof error === "object") {
    const record = error as Record<string, unknown>;
    for (const key of ["message", "msg", "error_description", "error"] as const) {
      const value = record[key];
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed && trimmed !== "{}" && trimmed !== "[object Object]") {
          return trimmed;
        }
      }
    }
  }

  if (error instanceof Error) {
    const trimmed = error.message?.trim();
    if (trimmed && trimmed !== "{}") return trimmed;
  }

  return fallback;
}

/**
 * Maps Supabase Auth errors to user-friendly messages.
 */
export function mapAuthError(error: unknown): string {
  const raw = toErrorMessage(error, "");
  if (!raw) {
    return "Something went wrong. Please try again.";
  }

  const message = raw.toLowerCase();
  const code =
    typeof error === "object" &&
    error &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
      ? (error as { code: string }).code.toLowerCase()
      : "";

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

  if (isAuthRateLimitError(error)) {
    return "Please wait a moment, then try again.";
  }

  return raw;
}

/** Supabase email/auth throttle (common on repeated sign-up email sends). */
export function isAuthRateLimitError(error: unknown): boolean {
  if (!error) return false;
  const message = toErrorMessage(error, "").toLowerCase();
  const code =
    typeof error === "object" &&
    error &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
      ? (error as { code: string }).code.toLowerCase()
      : "";
  return (
    message.includes("rate limit") ||
    message.includes("too many") ||
    message.includes("security purposes") ||
    message.includes("only request this after") ||
    code === "over_request_rate_limit" ||
    code === "over_email_send_rate_limit"
  );
}

/** Sign-up specific messages — no scary “security / too many attempts” copy. */
export function mapSignUpError(error: unknown): string {
  if (isAuthRateLimitError(error)) {
    return "A verification email may already be on the way. Check your inbox, or sign in if you already registered.";
  }

  const mapped = mapAuthError(error);
  if (!mapped || mapped === "{}" || mapped === "[object Object]") {
    return "Could not create your account. Please try again.";
  }
  return mapped;
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
