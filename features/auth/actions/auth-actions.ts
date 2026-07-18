"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  mapAuthError,
  REMEMBER_ME_COOKIE,
  resolvePostAuthPath,
  zodFieldErrors,
} from "@/features/auth/lib/auth-utils";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updateEmailSchema,
  updatePasswordSchema,
  updateProfileSchema,
} from "@/features/auth/schemas/auth";
import { SITE_URL } from "@/lib/constants";
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

  if (isOwnerLogin) {
    const bootstrapped = await ensureSuperAdminAccount();
    if (!bootstrapped.ok) {
      return {
        success: false,
        error: `Super admin setup failed: ${bootstrapped.error}`,
      };
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
    return {
      success: false,
      error: isOwnerLogin
        ? `Invalid credentials after setup. Confirm SUPER_ADMIN_PASSWORD in .env matches what you typed, then restart the server. (${mapAuthError(error)})`
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

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
      },
      emailRedirectTo: `${SITE_URL}/auth/callback?next=/dashboard`,
    },
  });

  if (error) {
    return {
      success: false,
      error: mapAuthError(error),
      fields: {
        fullName: parsed.data.fullName,
        email: parsed.data.email,
      },
    };
  }

  // Ensure profile row exists when a session is available (DB trigger covers signup)
  if (data.user && data.session) {
    await supabase.from("profiles").upsert(
      {
        id: data.user.id,
        email: parsed.data.email,
        full_name: parsed.data.fullName,
        role: "user",
        status: "active",
      },
      { onConflict: "id" },
    );

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

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${SITE_URL}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return { success: false, error: mapAuthError(error) };
  }

  return {
    success: true,
    message: "If an account exists for that email, a reset link has been sent.",
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
