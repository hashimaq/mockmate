"use client";

import { Check, Circle } from "lucide-react";

import { cn } from "@/lib/utils";

export const PASSWORD_REQUIREMENTS = [
  { id: "length", label: "At least 8 characters", test: (v: string) => v.length >= 8 },
  { id: "upper", label: "One uppercase letter (A–Z)", test: (v: string) => /[A-Z]/.test(v) },
  { id: "lower", label: "One lowercase letter (a–z)", test: (v: string) => /[a-z]/.test(v) },
  { id: "number", label: "One number (0–9)", test: (v: string) => /[0-9]/.test(v) },
] as const;

export function PasswordRequirements({
  password,
  className,
}: {
  password: string;
  className?: string;
}) {
  return (
    <ul
      className={cn("space-y-1.5 rounded-xl border border-border/70 bg-muted/40 p-3", className)}
      aria-label="Password requirements"
    >
      {PASSWORD_REQUIREMENTS.map((item) => {
        const met = item.test(password);
        return (
          <li
            key={item.id}
            className={cn(
              "flex items-center gap-2 text-xs",
              met ? "text-primary" : "text-muted-foreground",
            )}
          >
            {met ? (
              <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
            ) : (
              <Circle className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
            )}
            <span>{item.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
