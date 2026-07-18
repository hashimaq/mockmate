import type { Metadata } from "next";

import { DashboardHome } from "@/features/dashboard/components/dashboard-home";
import { getCurrentProfile } from "@/services/auth";
import { getDashboardOverview } from "@/services/dashboard";

export const metadata: Metadata = {
  title: "Overview",
};

export default async function DashboardPage() {
  const [overview, profile] = await Promise.all([
    getDashboardOverview(),
    getCurrentProfile(),
  ]);

  const displayName =
    profile?.full_name?.split(" ")[0] ||
    profile?.email?.split("@")[0] ||
    "there";

  return <DashboardHome overview={overview} displayName={displayName} />;
}
