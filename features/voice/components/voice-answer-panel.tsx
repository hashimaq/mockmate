"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Mic,
  MicOff,
  Pause,
  Play,
  RotateCcw,
  Square,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { VoiceService } from "@/services/voice/voice-service";
import type {
  MicPermissionState,
  VoiceRecorderStatus,
} from "@/services/voice/types";
import { cn } from "@/lib/utils";

type VoiceAnswerPanelProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function VoiceAnswerPanel({
  value,
  onChange,
  disabled,
}: VoiceAnswerPanelProps) {
  const voiceRef = useRef<VoiceService | null>(null);
  const baselineRef = useRef(value);
  const committedRef = useRef(value);
  const [permission, setPermission] = useState<MicPermissionState>("unknown");
  const [status, setStatus] = useState<VoiceRecorderStatus>("idle");
  const [interim, setInterim] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  if (!voiceRef.current) {
    voiceRef.current = new VoiceService();
  }

  useEffect(() => {
    committedRef.current = value;
  }, [value]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!VoiceService.isRecognitionSupported()) {
        if (!cancelled) setPermission("unsupported");
        return;
      }
      const state = await voiceRef.current!.ensureMicrophone();
      if (!cancelled) setPermission(state);
    })();
    return () => {
      cancelled = true;
      voiceRef.current?.recognition.stop(true);
    };
  }, []);

  useEffect(() => {
    if (status !== "listening") return;
    const id = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [status]);

  function recognitionHandlers() {
    return {
      onInterim: (text: string) => {
        setInterim(text);
      },
      onFinal: (text: string) => {
        const next = voiceRef.current!.appendTranscript(
          committedRef.current,
          text,
        );
        committedRef.current = next;
        onChange(next);
        setInterim("");
      },
      onError: (message: string) => {
        setError(message);
        setStatus("error");
        toast.error(message);
      },
      onStart: () => {
        setStatus("listening");
        setError(null);
      },
      onEnd: () => {
        // pause/stop handled by status flags
      },
    };
  }

  async function startRecording(resetBaseline: boolean) {
    setError(null);
    if (!VoiceService.isRecognitionSupported()) {
      setPermission("unsupported");
      setError(
        "Speech recognition is not supported in this browser. Try Chrome or Edge.",
      );
      return;
    }

    const mic = await voiceRef.current!.ensureMicrophone();
    setPermission(mic);
    if (mic !== "granted") {
      setError(
        mic === "denied"
          ? "Microphone permission denied. Enable access in your browser settings."
          : mic === "unavailable"
            ? "No microphone was found on this device."
            : "Voice answering is not supported in this browser.",
      );
      setStatus("error");
      return;
    }

    if (resetBaseline) {
      baselineRef.current = value;
      setSeconds(0);
    }

    setInterim("");
    voiceRef.current!.recognition.start(recognitionHandlers());
    setStatus("listening");
  }

  function pauseRecording() {
    voiceRef.current?.recognition.pause();
    setStatus("paused");
    setInterim("");
  }

  function resumeRecording() {
    voiceRef.current?.recognition.resume(recognitionHandlers());
    setStatus("listening");
  }

  function stopRecording() {
    voiceRef.current?.recognition.stop(true);
    setInterim("");
    setStatus("saved");
  }

  function discardRecording() {
    voiceRef.current?.recognition.stop(true);
    setInterim("");
    setSeconds(0);
    committedRef.current = baselineRef.current;
    onChange(baselineRef.current);
    setStatus("idle");
  }

  function recordAgain() {
    voiceRef.current?.recognition.stop(true);
    baselineRef.current = value;
    setSeconds(0);
    setInterim("");
    void startRecording(false);
  }

  const livePreview =
    status === "listening" && interim
      ? voiceRef.current!.mergeLive(value, interim)
      : value;

  const statusLabel =
    status === "listening"
      ? "Listening..."
      : status === "paused"
        ? "Recording Paused"
        : status === "saved"
          ? "Recording Saved"
          : status === "error"
            ? "Microphone issue"
            : "Ready";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              status === "listening" && "border-primary/30 bg-primary/10 text-primary",
              status === "paused" && "border-border text-muted-foreground",
              status === "saved" && "border-primary/20 bg-primary/5 text-primary",
            )}
            aria-live="polite"
          >
            {status === "listening" ? (
              <Mic className="me-1 h-3.5 w-3.5" aria-hidden />
            ) : status === "paused" ? (
              <Pause className="me-1 h-3.5 w-3.5" aria-hidden />
            ) : status === "saved" ? (
              <CheckCircle2 className="me-1 h-3.5 w-3.5" aria-hidden />
            ) : (
              <MicOff className="me-1 h-3.5 w-3.5" aria-hidden />
            )}
            {status === "listening"
              ? "Listening..."
              : status === "paused"
                ? "Recording Paused"
                : status === "saved"
                  ? "Recording Saved"
                  : statusLabel}
          </Badge>
          <span className="text-xs tabular-nums text-muted-foreground" aria-live="polite">
            {formatDuration(seconds)}
          </span>
          <span className="text-xs text-muted-foreground">
            Mic:{" "}
            {permission === "granted"
              ? "ready"
              : permission === "denied"
                ? "blocked"
                : permission === "unsupported"
                  ? "unsupported"
                  : permission === "unavailable"
                    ? "unavailable"
                    : "checking…"}
          </span>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-wrap gap-2" role="group" aria-label="Voice recording controls">
        {status === "idle" || status === "saved" || status === "error" ? (
          <Button
            type="button"
            size="sm"
            onClick={() => void startRecording(true)}
            disabled={disabled || permission === "unsupported"}
          >
            <Mic className="h-4 w-4" aria-hidden />
            Start Recording
          </Button>
        ) : null}
        {status === "listening" ? (
          <>
            <Button type="button" size="sm" variant="outline" onClick={pauseRecording} disabled={disabled}>
              <Pause className="h-4 w-4" aria-hidden />
              Pause
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={stopRecording} disabled={disabled}>
              <Square className="h-4 w-4" aria-hidden />
              Stop
            </Button>
          </>
        ) : null}
        {status === "paused" ? (
          <>
            <Button type="button" size="sm" onClick={resumeRecording} disabled={disabled}>
              <Play className="h-4 w-4" aria-hidden />
              Resume
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={stopRecording} disabled={disabled}>
              <Square className="h-4 w-4" aria-hidden />
              Stop
            </Button>
          </>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={discardRecording}
          disabled={disabled || (status === "idle" && !value)}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
          Discard Recording
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={recordAgain}
          disabled={disabled || permission === "unsupported"}
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          Record Again
        </Button>
      </div>

      <Textarea
        id="answer-voice"
        value={livePreview}
        onChange={(event) => {
          committedRef.current = event.target.value;
          onChange(event.target.value);
        }}
        placeholder="Your transcript appears here. You can edit anytime…"
        className="min-h-[220px]"
        aria-describedby="voice-answer-help"
        disabled={disabled}
      />
      <p id="voice-answer-help" className="text-xs text-muted-foreground">
        Live transcript becomes your answer. Edit, delete, or append more speech
        anytime. Autosave still runs.
      </p>
    </div>
  );
}
