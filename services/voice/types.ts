export type VoiceSettings = {
  user_id: string;
  enable_voice_mode: boolean;
  auto_read_questions: boolean;
  speech_rate: number;
  preferred_voice: string | null;
  created_at: string;
  updated_at: string;
};

export type VoiceSettingsInput = {
  enableVoiceMode: boolean;
  autoReadQuestions: boolean;
  speechRate: number;
  preferredVoice: string | null;
};

export const DEFAULT_VOICE_SETTINGS: VoiceSettingsInput = {
  enableVoiceMode: true,
  autoReadQuestions: false,
  speechRate: 1,
  preferredVoice: null,
};

export type MicPermissionState =
  | "unknown"
  | "granted"
  | "denied"
  | "unsupported"
  | "unavailable";

export type VoiceRecorderStatus =
  | "idle"
  | "listening"
  | "paused"
  | "saved"
  | "error";

export type AnswerInputMode = "type" | "voice";
