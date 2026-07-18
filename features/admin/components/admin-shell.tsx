"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { LogOut, Menu, Shield, X } from "lucide-react";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/features/auth/actions/auth-actions";
import { ADMIN_NAV } from "@/features/admin/data/nav";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/database";

import "@/features/admin/styles/admin-console.css";

type AdminShellProps = {
  profile: Profile;
  unreadNotifications: number;
  children: React.ReactNode;
};

function NavLinks({
  pathname,
  onNavigate,
  unreadNotifications,
}: {
  pathname: string;
  onNavigate?: () => void;
  unreadNotifications: number;
}) {
  const sections: Array<{
    id: "operate" | "insight" | "platform";
    label: string;
  }> = [
    { id: "operate", label: "Operate" },
    { id: "insight", label: "Insight" },
    { id: "platform", label: "Platform" },
  ];

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.id}>
          <p className="admin-nav-section mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em]">
            {section.label}
          </p>
          <nav className="space-y-0.5" aria-label={`${section.label} navigation`}>
            {ADMIN_NAV.filter((item) => item.section === section.id).map(
              (item) => {
                const active =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className="admin-nav-link flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="flex-1">{item.label}</span>
                    {item.href === "/admin/notifications" &&
                    unreadNotifications > 0 ? (
                      <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                        {unreadNotifications > 99
                          ? "99+"
                          : unreadNotifications}
                      </span>
                    ) : null}
                  </Link>
                );
              },
            )}
          </nav>
        </div>
      ))}
    </div>
  );
}

export function AdminShell({
  profile,
  unreadNotifications,
  children,
}: AdminShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [signingOut, startSignOut] = useTransition();

  function handleSignOut() {
    startSignOut(() => {
      void signOutAction();
    });
  }

  return (
    <div className="admin-console">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to admin content
      </a>

      <div className="flex min-h-screen">
        <aside
          className="admin-sidebar fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r lg:flex"
          aria-label="Admin navigation"
        >
          <div className="flex items-center gap-3 border-b border-[var(--admin-sidebar-border)] px-4 py-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Shield className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">
                MockMate Console
              </p>
              <p className="text-[11px] capitalize text-muted-foreground">
                {profile.role.replace("_", " ")}
              </p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-4">
            <NavLinks
              pathname={pathname}
              unreadNotifications={unreadNotifications}
            />
          </div>
          <div className="border-t border-[var(--admin-sidebar-border)] p-3">
            <p className="truncate px-2 text-xs text-muted-foreground">
              {profile.email}
            </p>
            <Button
              type="button"
              variant="ghost"
              disabled={signingOut}
              onClick={handleSignOut}
              className="mt-2 w-full justify-start text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              {signingOut ? "Signing out…" : "Log out"}
            </Button>
          </div>
        </aside>

        {open ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-foreground/40"
              aria-label="Close navigation"
              onClick={() => setOpen(false)}
            />
            <aside className="admin-sidebar relative z-50 flex h-full w-72 flex-col border-r">
              <div className="flex items-center justify-between border-b border-[var(--admin-sidebar-border)] px-4 py-4">
                <p className="text-sm font-semibold text-foreground">
                  MockMate Console
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-4">
                <NavLinks
                  pathname={pathname}
                  unreadNotifications={unreadNotifications}
                  onNavigate={() => setOpen(false)}
                />
              </div>
              <div className="border-t border-[var(--admin-sidebar-border)] p-3">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={signingOut}
                  onClick={handleSignOut}
                  className="w-full justify-start text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <LogOut className="h-4 w-4" aria-hidden />
                  {signingOut ? "Signing out…" : "Log out"}
                </Button>
              </div>
            </aside>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
          <header className="admin-header sticky top-0 z-20 flex items-center justify-between gap-3 border-b px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-xl border border-border p-2 text-foreground lg:hidden"
                onClick={() => setOpen(true)}
                aria-label="Open admin navigation"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Enterprise Control Panel
                </p>
                <p className="text-xs text-muted-foreground">
                  Platform-wide operations · not a candidate workspace
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link
                href="/admin/notifications"
                className={cn(
                  "relative rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted",
                )}
                aria-label={`Notifications${unreadNotifications ? `, ${unreadNotifications} unread` : ""}`}
              >
                Alerts
                {unreadNotifications > 0 ? (
                  <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                    {unreadNotifications > 99 ? "99+" : unreadNotifications}
                  </span>
                ) : null}
              </Link>
              <Link
                href="/admin/system"
                className="admin-btn-primary hidden rounded-xl px-3 py-1.5 text-xs font-semibold sm:inline-flex"
              >
                System status
              </Link>
            </div>
          </header>
          <main id="admin-main" className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
