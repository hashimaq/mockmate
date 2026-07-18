"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { Textarea } from "@/components/ui/textarea";
import { AnswerModeToggle } from "@/features/voice/components/answer-mode-toggle";
import type { AnswerInputMode, VoiceSettingsInput } from "@/services/voice/types";

const VoiceAnswerPanel = dynamic(
  () =>
    import("@/features/voice/components/voice-answer-panel").then(
      (mod) => mod.VoiceAnswerPanel,
    ),
  {
    ssr: false,
    loading: () => (
      <p className="text-sm text-muted-foreground" role="status">
        Loading voice tools…
      </p>
    ),
  },
);

type InterviewAnswerInputProps = {
  voiceSettings: VoiceSettingsInput;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

/**
 * Type + optional Voice answer input. Mode switches never clear the answer.
 */
export function InterviewAnswerInput({
  voiceSettings,
  value,
  onChange,
  disabled,
}: InterviewAnswerInputProps) {
  const [mode, setMode] = useState<AnswerInputMode>("type");
  const voiceEnabled = voiceSettings.enableVoiceMode;

  return (
    <div className="space-y-3">
      {voiceEnabled ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <AnswerModeToggle
            mode={mode}
            onChange={setMode}
            disabled={disabled}
          />
          <p className="text-xs text-muted-foreground">
            Switching modes keeps your current answer.
          </p>
        </div>
      ) : null}

      {voiceEnabled && mode === "voice" ? (
        <VoiceAnswerPanel
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      ) : (
        <Textarea
          id="answer"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Type your response…"
          className="min-h-[220px]"
          aria-describedby="answer-help"
          disabled={disabled}
        />
      )}
    </div>
  );
}
