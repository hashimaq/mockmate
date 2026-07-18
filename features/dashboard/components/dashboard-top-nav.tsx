"use client";

import { Bell, Menu, Search } from "lucide-react";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProfileMenu } from "@/features/dashboard/components/profile-menu";

type DashboardTopNavProps = {
  onMenuClick: () => void;
  email: string;
  fullName: string | null | undefined;
  avatarUrl: string | null | undefined;
};

export function DashboardTopNav({
  onMenuClick,
  email,
  fullName,
  avatarUrl,
}: DashboardTopNavProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </Button>

        <div className="relative hidden min-w-0 flex-1 md:block md:max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            placeholder="Search interviews, reports… (coming soon)"
            className="h-10 pl-9"
            aria-label="Search coming soon"
            aria-disabled="true"
            readOnly
            tabIndex={-1}
          />
        </div>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Search coming soon"
            aria-disabled="true"
            disabled
          >
            <Search className="h-4 w-4" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Notifications coming soon"
            aria-disabled="true"
            disabled
          >
            <Bell className="h-4 w-4" aria-hidden />
          </Button>
          <ThemeToggle />
          <ProfileMenu
            email={email}
            fullName={fullName}
            avatarUrl={avatarUrl}
          />
        </div>
      </div>
    </header>
  );
}
