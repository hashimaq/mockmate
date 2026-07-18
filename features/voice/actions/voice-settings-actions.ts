"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { toSafeClientError } from "@/lib/security/action-validation";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/services/auth";
import { DEFAULT_VOICE_SETTINGS } from "@/services/voice/types";
import { VoiceSettingsService } from "@/services/voice/voice-settings-service";

export type VoiceSettingsActionResult = {
  success: boolean;
  error?: string;
  message?: string;
  settings?: {
    enableVoiceMode: boolean;
    autoReadQuestions: boolean;
    speechRate: number;
    preferredVoice: string | null;
  };
};

const voiceSettingsSchema = z.object({
  enableVoiceMode: z.boolean(),
  autoReadQuestions: z.boolean(),
  speechRate: z.number().min(0.5).max(2),
  preferredVoice: z.string().trim().max(200).nullable(),
});

export async function getVoiceSettingsAction(): Promise<VoiceSettingsActionResult> {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: "You must be signed in" };
  }

  try {
    const supabase = await createClient();
    const settings = await new VoiceSettingsService(supabase).getForUser(
      user.id,
    );
    return { success: true, settings };
  } catch (error) {
    return {
      success: true,
      settings: { ...DEFAULT_VOICE_SETTINGS },
      error: toSafeClientError(error, "Using default voice settings"),
    };
  }
}

export async function saveVoiceSettingsAction(input: {
  enableVoiceMode: boolean;
  autoReadQuestions: boolean;
  speechRate: number;
  preferredVoice: string | null;
}): Promise<VoiceSettingsActionResult> {
  const parsed = voiceSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid voice settings",
    };
  }

  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: "You must be signed in" };
  }

  try {
    const supabase = await createClient();
    const settings = await new VoiceSettingsService(supabase).upsertForUser(
      user.id,
      parsed.data,
    );
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/interviews");
    return {
      success: true,
      message: "Voice interview settings saved.",
      settings,
    };
  } catch (error) {
    return {
      success: false,
      error: toSafeClientError(error, "Failed to save voice settings"),
    };
  }
}
