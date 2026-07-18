export type SpeechVoiceOption = {
  voiceURI: string;
  name: string;
  lang: string;
};

export class SpeechSynthesisService {
  private utterance: SpeechSynthesisUtterance | null = null;
  private muted = false;

  static isSupported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  static listVoices(): SpeechVoiceOption[] {
    if (!this.isSupported()) return [];
    return window.speechSynthesis.getVoices().map((voice) => ({
      voiceURI: voice.voiceURI,
      name: voice.name,
      lang: voice.lang,
    }));
  }

  /** Wait briefly for voices to load (Chrome populates async). */
  static async loadVoices(): Promise<SpeechVoiceOption[]> {
    if (!this.isSupported()) return [];
    const existing = this.listVoices();
    if (existing.length > 0) return existing;

    return new Promise((resolve) => {
      const done = () => resolve(this.listVoices());
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        done();
      };
      window.setTimeout(done, 500);
    });
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) {
      this.pause();
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  speak(input: {
    text: string;
    rate?: number;
    voiceURI?: string | null;
    onEnd?: () => void;
    onError?: (message: string) => void;
  }): void {
    if (!SpeechSynthesisService.isSupported()) {
      input.onError?.(
        "Text-to-speech is not supported in this browser.",
      );
      return;
    }

    if (this.muted) {
      return;
    }

    this.cancel();
    const utterance = new SpeechSynthesisUtterance(input.text);
    utterance.rate = Math.min(2, Math.max(0.5, input.rate ?? 1));

    if (input.voiceURI) {
      const match = window.speechSynthesis
        .getVoices()
        .find((voice) => voice.voiceURI === input.voiceURI);
      if (match) utterance.voice = match;
    }

    utterance.onend = () => {
      this.utterance = null;
      input.onEnd?.();
    };
    utterance.onerror = () => {
      this.utterance = null;
      input.onError?.("Could not read the question aloud.");
    };

    this.utterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  pause(): void {
    if (!SpeechSynthesisService.isSupported()) return;
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
    }
  }

  resume(): void {
    if (!SpeechSynthesisService.isSupported()) return;
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  }

  replay(input: Parameters<SpeechSynthesisService["speak"]>[0]): void {
    this.cancel();
    this.speak(input);
  }

  cancel(): void {
    if (!SpeechSynthesisService.isSupported()) return;
    window.speechSynthesis.cancel();
    this.utterance = null;
  }

  isSpeaking(): boolean {
    if (!SpeechSynthesisService.isSupported()) return false;
    return window.speechSynthesis.speaking && !window.speechSynthesis.paused;
  }

  isPaused(): boolean {
    if (!SpeechSynthesisService.isSupported()) return false;
    return window.speechSynthesis.paused;
  }
}
