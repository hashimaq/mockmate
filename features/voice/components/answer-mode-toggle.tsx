"use client";

import { Keyboard, Mic } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AnswerInputMode } from "@/services/voice/types";

type AnswerModeToggleProps = {
  mode: AnswerInputMode;
  onChange: (mode: AnswerInputMode) => void;
  disabled?: boolean;
};

export function AnswerModeToggle({
  mode,
  onChange,
  disabled,
}: AnswerModeToggleProps) {
  return (
    <div
      className="inline-flex rounded-xl border border-border/80 bg-background/60 p-1"
      role="group"
      aria-label="Answer input mode"
    >
      <Button
        type="button"
        size="sm"
        variant={mode === "type" ? "default" : "ghost"}
        className={cn("h-9 gap-1.5", mode === "type" && "shadow-sm")}
        aria-pressed={mode === "type"}
        disabled={disabled}
        onClick={() => onChange("type")}
      >
        <Keyboard className="h-3.5 w-3.5" aria-hidden />
        Type Answer
      </Button>
      <Button
        type="button"
        size="sm"
        variant={mode === "voice" ? "default" : "ghost"}
        className={cn("h-9 gap-1.5", mode === "voice" && "shadow-sm")}
        aria-pressed={mode === "voice"}
        disabled={disabled}
        onClick={() => onChange("voice")}
      >
        <Mic className="h-3.5 w-3.5" aria-hidden />
        Voice Answer
      </Button>
    </div>
  );
}
