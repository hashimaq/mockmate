import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { getCurrentProfile, getSessionUser } from "@/services/auth";

export const metadata: Metadata = {
  title: {
    default: "Dashboard",
    template: "%s · MockMate",
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const profile = await getCurrentProfile();

  return (
    <DashboardShell
      email={profile?.email ?? user.email ?? ""}
      fullName={profile?.full_name}
      avatarUrl={profile?.avatar_url}
    >
      {children}
    </DashboardShell>
  );
}
