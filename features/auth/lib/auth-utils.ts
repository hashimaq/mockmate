import { isStaffRole } from "@/services/rbac/roles";

function isOpaqueErrorText(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (trimmed === "{}" || trimmed === "[object Object]") return true;
  // Supabase sometimes returns this exact opaque string
  if (trimmed.toLowerCase() === "something went wrong. please try again.") {
    return true;
  }
  return false;
}

function authErrorCode(error: unknown): string {
  if (typeof error !== "object" || !error) return "";
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code.toLowerCase() : "";
}

function authErrorStatus(error: unknown): number | null {
  if (typeof error !== "object" || !error) return null;
  const status = (error as { status?: unknown }).status;
  return typeof status === "number" ? status : null;
}

/** Always return a human-readable string (never `{}` / empty objects). */
export function toErrorMessage(error: unknown, fallback: string): string {
  if (error == null) return fallback;

  if (typeof error === "string") {
    return isOpaqueErrorText(error) ? fallback : error.trim();
  }

  // Prefer Error.message before scanning other keys (AuthError is an Error).
  if (error instanceof Error) {
    const trimmed = error.message?.trim();
    if (trimmed && !isOpaqueErrorText(trimmed)) return trimmed;
  }

  if (typeof error === "object") {
    const record = error as Record<string, unknown>;
    for (const key of ["message", "msg", "error_description"] as const) {
      const value = record[key];
      if (typeof value === "string" && !isOpaqueErrorText(value)) {
        return value.trim();
      }
    }

    // `error` is often a short machine code — only use if descriptive
    const codeLike = record.error;
    if (
      typeof codeLike === "string" &&
      !isOpaqueErrorText(codeLike) &&
      (codeLike.includes(" ") || codeLike.length > 24)
    ) {
      return codeLike.trim();
    }

    const code = authErrorCode(error);
    if (code) {
      return code.replace(/_/g, " ");
    }

    const status = authErrorStatus(error);
    if (status) {
      return `Request failed (${status}). Please try again.`;
    }
  }

  return fallback;
}

/**
 * Maps Supabase Auth errors to user-friendly messages.
 */
export function mapAuthError(error: unknown): string {
  const code = authErrorCode(error);
  const raw = toErrorMessage(error, "");
  const message = raw.toLowerCase();

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
    message.includes("already registered") ||
    code === "user_already_exists" ||
    code === "email_exists"
  ) {
    return "An account with this email already exists. Sign in, or check your inbox to verify.";
  }

  if (
    message.includes("password") &&
    (message.includes("weak") || message.includes("pwned") || code === "weak_password")
  ) {
    return "Password is too weak. Use at least 8 characters with mixed case and a number.";
  }

  if (
    message.includes("redirect") &&
    (message.includes("not allowed") || message.includes("whitelist") || message.includes("allow"))
  ) {
    return "Sign-up redirect URL is not allowed in Supabase Auth settings. Add your site URL under Redirect URLs.";
  }

  if (
    message.includes("error sending") ||
    message.includes("confirmation email") ||
    code === "over_email_send_rate_limit"
  ) {
    return "Could not send the verification email. Check spam later, or configure Supabase SMTP (Resend).";
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

  if (!raw) {
    return "Could not complete authentication. If you already registered, try signing in or check your email.";
  }

  return raw;
}

/** Supabase email/auth throttle (common on repeated sign-up email sends). */
export function isAuthRateLimitError(error: unknown): boolean {
  if (!error) return false;
  const message = toErrorMessage(error, "").toLowerCase();
  const code = authErrorCode(error);
  return (
    message.includes("rate limit") ||
    message.includes("too many") ||
    message.includes("security purposes") ||
    message.includes("only request this after") ||
    code === "over_request_rate_limit" ||
    code === "over_email_send_rate_limit"
  );
}

/** True when this email is already in Auth (duplicate sign-up). */
export function isAlreadyRegisteredError(error: unknown): boolean {
  if (!error) return false;
  const message = toErrorMessage(error, "").toLowerCase();
  const code = authErrorCode(error);
  return (
    message.includes("user already registered") ||
    message.includes("already been registered") ||
    message.includes("already registered") ||
    code === "user_already_exists" ||
    code === "email_exists"
  );
}

/** Sign-up specific messages — no scary “security / too many attempts” copy. */
export function mapSignUpError(error: unknown): string {
  if (isAuthRateLimitError(error) || isAlreadyRegisteredError(error)) {
    return "A verification email may already be on the way. Check your inbox, or sign in if you already registered.";
  }

  const mapped = mapAuthError(error);
  if (!mapped || isOpaqueErrorText(mapped)) {
    return "Could not create your account. If you already registered, sign in or open the verification email.";
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
 * - Explicit `/dashboard` (or other user-app paths) is honored even for staff
 *   so Google sign-in can open the user app when requested.
 * - Otherwise staff default to `/admin`, users to `/dashboard`.
 * - Users never land in `/admin`.
 */
export function resolvePostAuthPath(
  role: string | null | undefined,
  requestedNext?: string | null,
): string {
  const home = isStaffRole(role) ? "/admin" : "/dashboard";
  const requested = getSafeRedirectPath(requestedNext, home);

  // Google / explicit "go to user app" should not be overridden by staff home
  if (isUserAppPath(requested)) {
    return requested;
  }

  if (isStaffRole(role)) {
    return isAdminPath(requested) ? requested : home;
  }

  return isAdminPath(requested) ? home : requested;
}
