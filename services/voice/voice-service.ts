import { SpeechRecognitionService } from "@/services/voice/speech-recognition-service";
import { SpeechSynthesisService } from "@/services/voice/speech-synthesis-service";
import { TranscriptService } from "@/services/voice/transcript-service";
import type { MicPermissionState } from "@/services/voice/types";

/**
 * Client-side facade for microphone + recognition.
 * Interview UI should depend on this, not browser APIs directly.
 */
export class VoiceService {
  readonly recognition = new SpeechRecognitionService();
  readonly synthesis = new SpeechSynthesisService();

  static isRecognitionSupported(): boolean {
    return SpeechRecognitionService.isSupported();
  }

  static isSynthesisSupported(): boolean {
    return SpeechSynthesisService.isSupported();
  }

  async ensureMicrophone(): Promise<MicPermissionState> {
    if (!SpeechRecognitionService.isSupported()) {
      return "unsupported";
    }
    return SpeechRecognitionService.requestMicrophonePermission();
  }

  appendTranscript(existing: string, chunk: string): string {
    return TranscriptService.append(existing, chunk);
  }

  mergeLive(committed: string, interim: string): string {
    return TranscriptService.mergeLive(committed, interim);
  }
}
