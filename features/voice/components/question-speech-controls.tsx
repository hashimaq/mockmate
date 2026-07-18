"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SpeechSynthesisService } from "@/services/voice/speech-synthesis-service";

type QuestionSpeechControlsProps = {
  questionText: string;
  questionId: string;
  autoRead: boolean;
  speechRate: number;
  preferredVoice: string | null;
  enabled?: boolean;
};

export function QuestionSpeechControls({
  questionText,
  questionId,
  autoRead,
  speechRate,
  preferredVoice,
  enabled = true,
}: QuestionSpeechControlsProps) {
  const synthRef = useRef<SpeechSynthesisService | null>(null);
  const [muted, setMuted] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const lastAutoId = useRef<string | null>(null);

  if (!synthRef.current) {
    synthRef.current = new SpeechSynthesisService();
  }

  useEffect(() => {
    return () => {
      synthRef.current?.cancel();
    };
  }, []);

  function speak(text: string) {
    if (!enabled || muted) return;
    synthRef.current?.speak({
      text,
      rate: speechRate,
      voiceURI: preferredVoice,
      onEnd: () => {
        setSpeaking(false);
        setPaused(false);
      },
      onError: () => {
        setSpeaking(false);
        setPaused(false);
      },
    });
    setSpeaking(true);
    setPaused(false);
  }

  useEffect(() => {
    if (!autoRead || !enabled || muted) return;
    if (lastAutoId.current === questionId) return;
    lastAutoId.current = questionId;
    speak(questionText);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only auto-read on question change
  }, [questionId, autoRead, enabled, muted, questionText]);

  if (!SpeechSynthesisService.isSupported() || !enabled) {
    return null;
  }

  return (
    <div
      className="mt-4 flex flex-wrap items-center gap-2"
      role="group"
      aria-label="Read question aloud"
    >
      <span className="me-1 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <Volume2 className="h-3.5 w-3.5" aria-hidden />
        Read Question Aloud
      </span>
      <Button
        type="button"
        size="sm"
        variant="outline"
        aria-label={paused ? "Resume reading question" : "Play question"}
        onClick={() => {
          if (paused) {
            synthRef.current?.resume();
            setPaused(false);
            setSpeaking(true);
            return;
          }
          speak(questionText);
        }}
      >
        <Play className="h-3.5 w-3.5" aria-hidden />
        Play
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        aria-label="Pause reading"
        disabled={!speaking || paused}
        onClick={() => {
          synthRef.current?.pause();
          setPaused(true);
          setSpeaking(false);
        }}
      >
        <Pause className="h-3.5 w-3.5" aria-hidden />
        Pause
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        aria-label="Replay question"
        onClick={() => {
          synthRef.current?.replay({
            text: questionText,
            rate: speechRate,
            voiceURI: preferredVoice,
            onEnd: () => {
              setSpeaking(false);
              setPaused(false);
            },
          });
          setSpeaking(true);
          setPaused(false);
        }}
      >
        <RotateCcw className="h-3.5 w-3.5" aria-hidden />
        Replay
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        aria-pressed={muted}
        aria-label={muted ? "Unmute question audio" : "Mute question audio"}
        onClick={() => {
          const next = !muted;
          setMuted(next);
          synthRef.current?.setMuted(next);
          if (next) {
            setSpeaking(false);
            setPaused(false);
          }
        }}
      >
        {muted ? (
          <VolumeX className="h-3.5 w-3.5" aria-hidden />
        ) : (
          <Volume2 className="h-3.5 w-3.5" aria-hidden />
        )}
        Mute
      </Button>
    </div>
  );
}
