import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/**
 * Service-role client for privileged operations (account deletion).
 * Server-only — never import from client components.
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  // Common misconfig: pasted anon key instead of service_role secret
  try {
    const payload = JSON.parse(
      Buffer.from(serviceKey.split(".")[1] ?? "", "base64url").toString("utf8"),
    ) as { role?: string };
    if (payload.role && payload.role !== "service_role") {
      throw new Error(
        `SUPABASE_SERVICE_ROLE_KEY has role "${payload.role}" (need service_role). ` +
          "Copy the service_role secret from Supabase → Project Settings → API.",
      );
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("service_role")) {
      throw error;
    }
    // Non-JWT secret formats are fine — skip claim check
  }

  return createSupabaseClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
