import "server-only";

import { captureException } from "@/lib/monitoring/logger";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export type EnsureSuperAdminResult =
  | { ok: true }
  | { ok: false; error: string };

function mapBootstrapAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid api key") || lower.includes("invalid jwt")) {
    return (
      "Invalid SUPABASE_SERVICE_ROLE_KEY on this deploy. In Supabase → Project Settings → API, " +
      "copy the service_role secret, then set it in Vercel → Project Settings → Environment Variables " +
      "(Production), and Redeploy. Local .env is not used on Vercel."
    );
  }
  return message;
}

function getOwnerCredentials(): { email: string; password: string } | null {
  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD?.trim();
  if (!email || !password) return null;
  return { email, password };
}

async function findAuthUserByEmail(
  email: string,
): Promise<{ id: string } | null> {
  const admin = createServiceRoleClient();
  const perPage = 200;

  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      captureException(error, { source: "ensureSuperAdmin.listUsers" });
      return null;
    }

    const match = data.users.find(
      (u) => u.email?.trim().toLowerCase() === email,
    );
    if (match) return { id: match.id };

    if (data.users.length < perPage) break;
  }

  return null;
}

/**
 * Ensures the SUPER_ADMIN_EMAIL account exists in Supabase Auth with
 * SUPER_ADMIN_PASSWORD, and that the profile role is super_admin.
 *
 * Still uses normal login — does not create a separate auth system.
 */
export async function ensureSuperAdminAccount(): Promise<EnsureSuperAdminResult> {
  const creds = getOwnerCredentials();
  if (!creds) {
    return {
      ok: false,
      error:
        "SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD is missing. Set them in Vercel → Environment Variables (Production) and Redeploy.",
    };
  }

  if (creds.password.length < 8) {
    return {
      ok: false,
      error: "SUPER_ADMIN_PASSWORD must be at least 8 characters.",
    };
  }

  try {
    const admin = createServiceRoleClient();

    // Fail fast with a clear message if the key/project pair is wrong
    const { error: probeError } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });
    if (probeError) {
      return { ok: false, error: mapBootstrapAuthError(probeError.message) };
    }

    let userId: string | null = null;
    const existing = await findAuthUserByEmail(creds.email);

    if (existing) {
      userId = existing.id;
      const { error } = await admin.auth.admin.updateUserById(userId, {
        password: creds.password,
        email_confirm: true,
      });
      if (error) {
        captureException(error, { source: "ensureSuperAdmin.updateUser" });
        return { ok: false, error: mapBootstrapAuthError(error.message) };
      }
    } else {
      const { data, error } = await admin.auth.admin.createUser({
        email: creds.email,
        password: creds.password,
        email_confirm: true,
        user_metadata: { full_name: "Super Admin" },
      });
      if (error || !data.user) {
        captureException(error ?? new Error("createUser returned no user"), {
          source: "ensureSuperAdmin.createUser",
        });
        return {
          ok: false,
          error: mapBootstrapAuthError(
            error?.message ??
              "Could not create super admin account. Check SUPABASE_SERVICE_ROLE_KEY.",
          ),
        };
      }
      userId = data.user.id;
    }

    const { error: roleError } = await admin
      .from("profiles")
      .update({ role: "super_admin", status: "active" })
      .eq("id", userId);

    if (roleError) {
      const { data: profile } = await admin
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

      if (!profile) {
        const { error: upsertError } = await admin.from("profiles").upsert({
          id: userId,
          email: creds.email,
          full_name: "Super Admin",
          role: "super_admin",
          status: "active",
        });
        if (upsertError) {
          captureException(upsertError, {
            source: "ensureSuperAdmin.profileUpsert",
          });
          return { ok: false, error: upsertError.message };
        }
      } else {
        captureException(roleError, { source: "ensureSuperAdmin.roleUpdate" });
        return { ok: false, error: roleError.message };
      }
    }

    return { ok: true };
  } catch (error) {
    captureException(error, { source: "ensureSuperAdminAccount" });
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Super admin bootstrap failed unexpectedly.",
    };
  }
}
