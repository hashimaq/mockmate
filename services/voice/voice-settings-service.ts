import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  DEFAULT_VOICE_SETTINGS,
  type VoiceSettingsInput,
} from "@/services/voice/types";
import type { Database, VoiceSettingsRow } from "@/types/database";

type Client = SupabaseClient<Database>;

function toInput(row: VoiceSettingsRow | null): VoiceSettingsInput {
  if (!row) return { ...DEFAULT_VOICE_SETTINGS };
  return {
    enableVoiceMode: row.enable_voice_mode,
    autoReadQuestions: row.auto_read_questions,
    speechRate: Number(row.speech_rate),
    preferredVoice: row.preferred_voice,
  };
}

export class VoiceSettingsService {
  constructor(private readonly supabase: Client) {}

  async getForUser(userId: string): Promise<VoiceSettingsInput> {
    const { data, error } = await this.supabase
      .from("voice_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      // Table may not be migrated yet — fall back to defaults
      if (error.message.toLowerCase().includes("voice_settings")) {
        return { ...DEFAULT_VOICE_SETTINGS };
      }
      throw new Error(error.message);
    }

    return toInput(data);
  }

  async upsertForUser(
    userId: string,
    input: VoiceSettingsInput,
  ): Promise<VoiceSettingsInput> {
    const rate = Math.min(2, Math.max(0.5, input.speechRate));

    const { data, error } = await this.supabase
      .from("voice_settings")
      .upsert(
        {
          user_id: userId,
          enable_voice_mode: input.enableVoiceMode,
          auto_read_questions: input.autoReadQuestions,
          speech_rate: rate,
          preferred_voice: input.preferredVoice,
        },
        { onConflict: "user_id" },
      )
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return toInput(data);
  }
}
