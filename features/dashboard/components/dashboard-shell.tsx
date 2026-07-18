"use client";

import { useState, type ReactNode } from "react";

import { DashboardSidebar } from "@/features/dashboard/components/dashboard-sidebar";
import { DashboardTopNav } from "@/features/dashboard/components/dashboard-top-nav";

type DashboardShellProps = {
  children: ReactNode;
  email: string;
  fullName: string | null | undefined;
  avatarUrl: string | null | undefined;
};

export function DashboardShell({
  children,
  email,
  fullName,
  avatarUrl,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopNav
          onMenuClick={() => setMobileOpen(true)}
          email={email}
          fullName={fullName}
          avatarUrl={avatarUrl}
        />
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
