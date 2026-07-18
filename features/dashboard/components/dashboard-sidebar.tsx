"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, LogOut, Mic2 } from "lucide-react";

import { signOutAction } from "@/features/auth/actions/auth-actions";
import { SidebarItem } from "@/features/dashboard/components/sidebar-item";
import { DASHBOARD_NAV } from "@/features/dashboard/data/nav";
import { Button } from "@/components/ui/button";
import { SITE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

const COLLAPSED_KEY = "mm_sidebar_collapsed";

type DashboardSidebarProps = {
  mobileOpen: boolean;
  onMobileClose: () => void;
};

export function DashboardSidebar({
  mobileOpen,
  onMobileClose,
}: DashboardSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const stored = window.localStorage.getItem(COLLAPSED_KEY);
    if (stored === "1") {
      setCollapsed(true);
    }
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onMobileClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen, onMobileClose]);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm transition-opacity lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onMobileClose}
        aria-hidden="true"
      />

      <aside
        id="dashboard-mobile-nav"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r border-border/70 bg-card/95 backdrop-blur-xl transition-all duration-300 lg:static lg:translate-x-0",
          collapsed ? "lg:w-[4.5rem]" : "lg:w-64",
          "w-72",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
        aria-label="Dashboard navigation"
        role={mobileOpen ? "dialog" : undefined}
        aria-modal={mobileOpen ? true : undefined}
      >
        <div
          className={cn(
            "flex h-16 items-center border-b border-border/70 px-4",
            collapsed ? "lg:justify-center lg:px-2" : "justify-between",
          )}
        >
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={onMobileClose}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary to-[oklch(0.55_0.12_130)] text-primary-foreground shadow-md shadow-primary/25 dark:to-[oklch(0.7_0.14_130)]">
              <Mic2 className="h-4 w-4" aria-hidden />
            </span>
            {!collapsed ? (
              <span className="text-lg font-bold tracking-tight lg:inline">
                {SITE_NAME}
              </span>
            ) : (
              <span className="sr-only lg:not-sr-only lg:hidden">{SITE_NAME}</span>
            )}
            {collapsed ? (
              <span className="hidden text-lg font-bold lg:sr-only">{SITE_NAME}</span>
            ) : null}
          </Link>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hidden lg:inline-flex"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" aria-hidden />
            ) : (
              <ChevronLeft className="h-4 w-4" aria-hidden />
            )}
          </Button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {DASHBOARD_NAV.map((item) => (
            <SidebarItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              collapsed={collapsed}
              onNavigate={onMobileClose}
            />
          ))}
        </nav>

        <div className="border-t border-border/70 p-3">
          <Button
            type="button"
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 text-muted-foreground hover:text-foreground",
              collapsed && "justify-center px-0",
            )}
            disabled={pending}
            onClick={() => startTransition(() => signOutAction())}
          >
            <LogOut className="h-4 w-4" aria-hidden />
            {!collapsed ? (pending ? "Signing out…" : "Logout") : null}
            {collapsed ? <span className="sr-only">Logout</span> : null}
          </Button>
        </div>
      </aside>
    </>
  );
}
