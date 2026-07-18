import "server-only";

import { headers } from "next/headers";

import { SITE_URL } from "@/lib/constants";

/**
 * Prefer the live request host (Vercel) so auth emails never point at localhost
 * when NEXT_PUBLIC_SITE_URL is missing or stale.
 */
export async function getAppOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (
    configured &&
    !configured.includes("localhost") &&
    !configured.includes("127.0.0.1")
  ) {
    return configured;
  }

  try {
    const headerStore = await headers();
    const host =
      headerStore.get("x-forwarded-host") ?? headerStore.get("host");
    const proto = headerStore.get("x-forwarded-proto") ?? "https";
    if (host) {
      return `${proto}://${host}`.replace(/\/$/, "");
    }
  } catch {
    // headers() unavailable outside a request
  }

  return (configured || SITE_URL).replace(/\/$/, "");
}
