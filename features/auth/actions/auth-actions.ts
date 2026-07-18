"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect, unstable_rethrow } from "next/navigation";

import {
  getAuthErrorStatus,
  isAlreadyRegisteredError,
  isAuthRateLimitError,
  mapAuthError,
  mapSignUpError,
  REMEMBER_ME_COOKIE,
  resolvePostAuthPath,
  toErrorMessage,
  zodFieldErrors,
} from "@/features/auth/lib/auth-utils";
import { logger } from "@/lib/monitoring/logger";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updateEmailSchema,
  updatePasswordSchema,
  updateProfileSchema,
} from "@/features/auth/schemas/auth";
import { getAppOrigin } from "@/lib/app-origin";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/services/auth";
import { notifyAdminEvent } from "@/services/notifications/admin-email-service";
import { ensureSuperAdminAccount } from "@/services/rbac/ensure-super-admin";
import {
  getHomePathForRole,
  syncOwnerSuperAdmin,
} from "@/services/rbac/rbac-service";

export type ActionResult = {
  success: boolean;
  message?: string;
  error?: string;
  /** Non-sensitive fields to restore after a failed submit */
  fields?: {
    email?: string;
    fullName?: string;
  };
  fieldErrors?: Record<string, string>;
};

function formEmail(formData: FormData): string {
  return String(formData.get("email") ?? "").trim();
}

function formFullName(formData: FormData): string {
  return String(formData.get("fullName") ?? "").trim();
}

export async function signInAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const email = formEmail(formData);
  const parsed = loginSchema.safeParse({
    email,
    password: formData.get("password"),
    rememberMe: formData.get("rememberMe") === "on" || formData.get("rememberMe") === "true",
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Please check your details.",
      fields: { email },
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const ownerEmail = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const isOwnerLogin =
    !!ownerEmail &&
    parsed.data.email.trim().toLowerCase() === ownerEmail;

  // Bootstrap is best-effort: if the account already exists, password login
  // should still work even when the service role key is wrong/stale in memory.
  let bootstrapError: string | null = null;
  if (isOwnerLogin) {
    const bootstrapped = await ensureSuperAdminAccount();
    if (!bootstrapped.ok) {
      bootstrapError = bootstrapped.error;
    }
  }

  const cookieStore = await cookies();
  cookieStore.set(REMEMBER_ME_COOKIE, parsed.data.rememberMe ? "1" : "0", {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: parsed.data.rememberMe ? 60 * 60 * 24 * 365 : undefined,
  });

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    if (isOwnerLogin && bootstrapError) {
      return {
        success: false,
        error: `Super admin setup failed: ${bootstrapError}`,
        fields: { email: parsed.data.email },
      };
    }
    return {
      success: false,
      error: isOwnerLogin
        ? `Could not sign in as owner. Confirm SUPER_ADMIN_PASSWORD matches the value set in Vercel env vars, then Redeploy. (${mapAuthError(error)})`
        : mapAuthError(error),
      fields: { email: parsed.data.email },
    };
  }

  let profile = await getCurrentProfile();
  if (profile) {
    profile = await syncOwnerSuperAdmin(profile);
  }

  if (profile?.status === "suspended") {
    await supabase.auth.signOut();
    return {
      success: false,
      error: "This account has been suspended. Contact support.",
      fields: { email: parsed.data.email },
    };
  }

  // Owner email always routes to admin console (even if role sync lagged)
  const next = resolvePostAuthPath(
    isOwnerLogin ? "super_admin" : profile?.role,
    String(formData.get("next") || ""),
  );
  redirect(next);
}

export async function signUpAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const fullName = formFullName(formData);
  const email = formEmail(formData);

  try {
    const parsed = registerSchema.safeParse({
      fullName,
      email,
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Please check your details.",
        fields: { fullName, email },
        fieldErrors: zodFieldErrors(parsed.error),
      };
    }

    const origin = await getAppOrigin();
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: {
          full_name: parsed.data.fullName,
        },
        emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
      },
    });

    if (error) {
      const status = getAuthErrorStatus(error);
      logger.warn("signUpAction auth error", {
        message: toErrorMessage(error, ""),
        code:
          typeof error === "object" &&
          error &&
          "code" in error &&
          typeof (error as { code?: unknown }).code === "string"
            ? (error as { code: string }).code
            : undefined,
        status: status ?? undefined,
      });

      // Duplicate / throttle → continue on verify path (no scary form errors)
      if (isAuthRateLimitError(error) || isAlreadyRegisteredError(error)) {
        redirect(
          `/verify-email?email=${encodeURIComponent(parsed.data.email)}`,
        );
      }

      // Auth 5xx often means user was created but confirmation email failed (SMTP).
      // Recover: try sign-in; if email-not-confirmed → verify page instead of hard fail.
      if (status !== null && status >= 500) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (!signInError) {
          const profile = await getCurrentProfile();
          void notifyAdminEvent({
            type: "user_registered",
            userName: parsed.data.fullName,
            userEmail: parsed.data.email,
          });
          redirect(getHomePathForRole(profile?.role));
        }
        const signInMsg = toErrorMessage(signInError, "").toLowerCase();
        if (
          signInMsg.includes("email not confirmed") ||
          signInMsg.includes("not confirmed")
        ) {
          redirect(
            `/verify-email?email=${encodeURIComponent(parsed.data.email)}`,
          );
        }
      }

      return {
        success: false,
        error: mapSignUpError(error),
        fields: {
          fullName: parsed.data.fullName,
          email: parsed.data.email,
        },
      };
    }

    // Supabase returns a user with empty identities when the email is already taken
    // (and email confirmation is enabled) — treat as "check your email / sign in".
    const identities = data.user?.identities ?? [];
    if (data.user && identities.length === 0) {
      redirect(
        `/verify-email?email=${encodeURIComponent(parsed.data.email)}`,
      );
    }

    // Ensure profile row exists when a session is available (DB trigger covers signup)
    if (data.user && data.session) {
      // Do not set role/status here — DB defaults + privilege trigger own those columns.
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: data.user.id,
          email: parsed.data.email,
          full_name: parsed.data.fullName,
        },
        { onConflict: "id" },
      );

      if (profileError) {
        logger.warn("signUpAction profile upsert failed", {
          message: profileError.message,
          code: profileError.code,
        });
      }

      const profile = await getCurrentProfile();
      void notifyAdminEvent({
        type: "user_registered",
        userName: parsed.data.fullName,
        userEmail: parsed.data.email,
      });

      redirect(getHomePathForRole(profile?.role));
    }

    void notifyAdminEvent({
      type: "user_registered",
      userName: parsed.data.fullName,
      userEmail: parsed.data.email,
    });

    redirect(`/verify-email?email=${encodeURIComponent(parsed.data.email)}`);
  } catch (error) {
    unstable_rethrow(error);

    logger.error("signUpAction unexpected error", {
      message: toErrorMessage(error, "unknown"),
    });

    return {
      success: false,
      error: mapSignUpError(error),
      fields: { fullName, email },
    };
  }
}

export async function forgotPasswordAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid email",
    };
  }

  const origin = await getAppOrigin();
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return { success: false, error: mapAuthError(error) };
  }

  return {
    success: true,
    message: "If an account exists for that email, a reset link has been sent.",
  };
}

export async function resendVerificationEmailAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { success: false, error: "Enter a valid email address." };
  }

  const origin = await getAppOrigin();
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
    },
  });

  if (error) {
    if (isAuthRateLimitError(error)) {
      return {
        success: false,
        error:
          "Email provider is throttling sends. Wait a couple of minutes, check spam, or configure Supabase SMTP (Resend).",
        fields: { email },
      };
    }
    return {
      success: false,
      error: mapAuthError(error),
      fields: { email },
    };
  }

  return {
    success: true,
    message: "Verification email sent. Check your inbox and spam folder.",
    fields: { email },
  };
}

export async function resetPasswordAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid password",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { success: false, error: mapAuthError(error) };
  }

  redirect("/login?reset=success");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const cookieStore = await cookies();
  cookieStore.delete(REMEMBER_ME_COOKIE);
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function updateProfileAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = updateProfileSchema.safeParse({
    fullName: formData.get("fullName"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid name",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be signed in." };
  }

  const { error: metaError } = await supabase.auth.updateUser({
    data: { full_name: parsed.data.fullName },
  });

  if (metaError) {
    return { success: false, error: mapAuthError(metaError) };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName })
    .eq("id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/settings");
  return { success: true, message: "Profile updated successfully." };
}

export async function updateEmailAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = updateEmailSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid email",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be signed in." };
  }

  if (user.email === parsed.data.email) {
    return { success: false, error: "That is already your current email." };
  }

  const { error } = await supabase.auth.updateUser({
    email: parsed.data.email,
  });

  if (error) {
    return { success: false, error: mapAuthError(error) };
  }

  await supabase
    .from("profiles")
    .update({ email: parsed.data.email })
    .eq("id", user.id);

  revalidatePath("/dashboard/settings");
  return {
    success: true,
    message: "Check your inbox to confirm the new email address.",
  };
}

export async function updatePasswordAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = updatePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid password",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { success: false, error: "You must be signed in." };
  }

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });

  if (verifyError) {
    return { success: false, error: "Current password is incorrect." };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { success: false, error: mapAuthError(error) };
  }

  return { success: true, message: "Password updated successfully." };
}

export async function uploadAvatarAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const file = formData.get("avatar");

  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "Please choose an image file." };
  }

  if (!file.type.startsWith("image/")) {
    return { success: false, error: "Only image files are allowed." };
  }

  if (file.size > 2 * 1024 * 1024) {
    return { success: false, error: "Image must be under 2MB." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be signed in." };
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${user.id}/avatar.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    return { success: false, error: uploadError.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  const avatarUrl = `${publicUrl}?t=${Date.now()}`;

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);

  if (profileError) {
    return { success: false, error: profileError.message };
  }

  await supabase.auth.updateUser({
    data: { avatar_url: avatarUrl },
  });

  revalidatePath("/dashboard/settings");
  return { success: true, message: "Profile photo updated." };
}

export async function deleteAccountAction(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be signed in." };
  }

  try {
    const admin = createServiceRoleClient();
    const { error } = await admin.auth.admin.deleteUser(user.id);

    if (error) {
      return { success: false, error: mapAuthError(error) };
    }
  } catch {
    return {
      success: false,
      error:
        "Account deletion is unavailable. Add SUPABASE_SERVICE_ROLE_KEY to enable it.",
    };
  }

  await supabase.auth.signOut();
  redirect("/login?deleted=1");
}
