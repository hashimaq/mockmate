import type { NavLink } from "@/types";

export const SITE_NAME = "MockMate";
export const SITE_DESCRIPTION =
  "AI-powered interview preparation. Practice mock interviews, get instant feedback, and land your dream job.";

const fallbackSiteUrl = "http://localhost:3000";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? fallbackSiteUrl;

export const NAV_LINKS: readonly NavLink[] = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
] as const;

/** Default destination after successful authentication */
export const DEFAULT_AUTH_REDIRECT = "/dashboard";
