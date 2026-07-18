"use client";

import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

type LoadingOverlayProps = {
  open: boolean;
  title: string;
  description?: string;
  /** Use fixed for full-viewport blocking (AI generation). */
  variant?: "fixed" | "absolute";
  className?: string;
};

export function LoadingOverlay({
  open,
  title,
  description,
  variant = "fixed",
  className,
}: LoadingOverlayProps) {
  if (!open) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "z-[60] flex items-center justify-center bg-background/70 backdrop-blur-sm",
        variant === "fixed" ? "fixed inset-0" : "absolute inset-0 rounded-2xl",
        className,
      )}
    >
      <div className="mx-4 flex max-w-sm flex-col items-center rounded-2xl border border-border/80 bg-card px-8 py-7 text-center shadow-xl shadow-foreground/10">
        <Loader2
          className="h-9 w-9 animate-spin text-primary"
          aria-hidden
        />
        <p className="mt-4 text-base font-semibold text-foreground">{title}</p>
        {description ? (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
        <span className="sr-only">{title}. Please wait.</span>
      </div>
    </div>
  );
}
