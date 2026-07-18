import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "secondary" | "outline";
};

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors",
        variant === "default" &&
          "bg-primary/10 text-primary border border-primary/15",
        variant === "secondary" &&
          "bg-secondary text-secondary-foreground border border-border/50",
        variant === "outline" && "border border-border text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
