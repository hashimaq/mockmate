import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type DashboardCardProps = HTMLAttributes<HTMLDivElement> & {
  padding?: "none" | "sm" | "md";
  children?: ReactNode;
};

export function DashboardCard({
  className,
  padding = "md",
  children,
  ...props
}: DashboardCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-card text-card-foreground shadow-sm shadow-foreground/5",
        padding === "md" && "p-5 sm:p-6",
        padding === "sm" && "p-4",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
