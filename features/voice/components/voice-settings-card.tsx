"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveVoiceSettingsAction } from "@/features/voice/actions/voice-settings-actions";
import { SpeechSynthesisService } from "@/services/voice/speech-synthesis-service";
import type { VoiceSettingsInput } from "@/services/voice/types";

type VoiceSettingsCardProps = {
  initialSettings: VoiceSettingsInput;
};

export function VoiceSettingsCard({ initialSettings }: VoiceSettingsCardProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [voices, setVoices] = useState<
    Array<{ voiceURI: string; name: string; lang: string }>
  >([]);
  const [pending, startTransition] = useTransition();
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(SpeechSynthesisService.isSupported());
    void SpeechSynthesisService.loadVoices().then(setVoices);
  }, []);

  function save() {
    startTransition(async () => {
      const result = await saveVoiceSettingsAction(settings);
      if (!result.success) {
        toast.error(result.error ?? "Could not save voice settings");
        return;
      }
      if (result.settings) setSettings(result.settings);
      toast.success(result.message ?? "Saved");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Voice Interview</CardTitle>
        <CardDescription>
          Control speech-to-text answering and optional question narration.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {!supported ? (
          <Alert>
            <AlertDescription>
              This browser has limited speech synthesis support. Voice answering
              still works best in Chrome or Edge.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="flex items-start gap-3">
          <Checkbox
            id="enableVoiceMode"
            checked={settings.enableVoiceMode}
            onCheckedChange={(checked) =>
              setSettings((prev) => ({
                ...prev,
                enableVoiceMode: checked === true,
              }))
            }
          />
          <div>
            <Label htmlFor="enableVoiceMode">Enable Voice Mode</Label>
            <p className="mt-1 text-xs text-muted-foreground">
              Show the Type / Voice toggle during interviews.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            id="autoReadQuestions"
            checked={settings.autoReadQuestions}
            onCheckedChange={(checked) =>
              setSettings((prev) => ({
                ...prev,
                autoReadQuestions: checked === true,
              }))
            }
          />
          <div>
            <Label htmlFor="autoReadQuestions">Auto Read Questions</Label>
            <p className="mt-1 text-xs text-muted-foreground">
              Automatically read each question aloud with browser text-to-speech.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="speechRate">
            Preferred Speech Rate ({settings.speechRate.toFixed(2)}x)
          </Label>
          <Input
            id="speechRate"
            type="range"
            min={0.5}
            max={2}
            step={0.05}
            value={settings.speechRate}
            onChange={(event) =>
              setSettings((prev) => ({
                ...prev,
                speechRate: Number(event.target.value),
              }))
            }
            aria-valuemin={0.5}
            aria-valuemax={2}
            aria-valuenow={settings.speechRate}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="preferredVoice">Preferred Voice</Label>
          <select
            id="preferredVoice"
            className="flex h-11 w-full rounded-xl border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={settings.preferredVoice ?? ""}
            onChange={(event) =>
              setSettings((prev) => ({
                ...prev,
                preferredVoice: event.target.value || null,
              }))
            }
          >
            <option value="">Browser default</option>
            {voices.map((voice) => (
              <option key={voice.voiceURI} value={voice.voiceURI}>
                {voice.name} ({voice.lang})
              </option>
            ))}
          </select>
          {voices.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Voices load from your browser when available.
            </p>
          ) : null}
        </div>

        <Button type="button" onClick={save} disabled={pending}>
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : null}
          Save voice settings
        </Button>
      </CardContent>
    </Card>
  );
}
