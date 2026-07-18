export type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};

export type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};

type RecognitionCtor = new () => SpeechRecognitionLike;

type RecognitionHandlers = {
  onInterim: (text: string) => void;
  onFinal: (text: string) => void;
  onError: (message: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
};

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export class SpeechRecognitionService {
  private recognition: SpeechRecognitionLike | null = null;
  private intentionalStop = false;
  private shouldRestart = false;
  private handlers: RecognitionHandlers | null = null;
  private restartTimer: ReturnType<typeof setTimeout> | null = null;

  static isSupported(): boolean {
    return Boolean(getRecognitionCtor());
  }

  static async requestMicrophonePermission(): Promise<
    "granted" | "denied" | "unsupported" | "unavailable"
  > {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      return "unsupported";
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      return "granted";
    } catch (error) {
      const name =
        error && typeof error === "object" && "name" in error
          ? String((error as { name: string }).name)
          : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        return "denied";
      }
      if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        return "unavailable";
      }
      return "unavailable";
    }
  }

  start(handlers: RecognitionHandlers): void {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      handlers.onError(
        "Speech recognition is not supported in this browser. Try Chrome or Edge.",
      );
      return;
    }

    this.stop(true);
    this.intentionalStop = false;
    this.shouldRestart = true;
    this.handlers = handlers;
    this.bindRecognition(new Ctor(), handlers);
  }

  private bindRecognition(
    recognition: SpeechRecognitionLike,
    handlers: RecognitionHandlers,
  ): void {
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      handlers.onStart?.();
    };

    recognition.onresult = (event) => {
      let interim = "";
      let finals = "";
      // Only process NEW results from resultIndex (never re-scan 0..n on restart)
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? "";
        if (result.isFinal) {
          finals += `${text} `;
        } else {
          interim += text;
        }
      }
      if (finals.trim()) {
        handlers.onFinal(finals.trim());
      }
      handlers.onInterim(interim.trim());
    };

    recognition.onerror = (event) => {
      const code = event.error;
      if (code === "aborted" || code === "no-speech") {
        if (code === "no-speech") {
          handlers.onError(
            "No speech detected. Click Start and try speaking again.",
          );
        }
        return;
      }
      if (code === "not-allowed") {
        this.shouldRestart = false;
        handlers.onError(
          "Microphone permission denied. Enable access in your browser settings.",
        );
        return;
      }
      if (code === "network") {
        handlers.onError(
          "Speech recognition lost connection. Check your network and try again.",
        );
        return;
      }
      handlers.onError(`Speech recognition error: ${code}`);
    };

    recognition.onend = () => {
      handlers.onEnd?.();
      // Never restart the SAME instance — Chrome re-emits old finals and loops text.
      if (this.shouldRestart && !this.intentionalStop && this.handlers) {
        if (this.restartTimer) clearTimeout(this.restartTimer);
        this.restartTimer = setTimeout(() => {
          if (!this.shouldRestart || this.intentionalStop || !this.handlers) {
            return;
          }
          const Ctor = getRecognitionCtor();
          if (!Ctor) return;
          try {
            this.recognition?.abort();
          } catch {
            // ignore
          }
          this.bindRecognition(new Ctor(), this.handlers);
        }, 120);
      }
    };

    this.recognition = recognition;
    try {
      recognition.start();
    } catch {
      handlers.onError("Could not start speech recognition. Try again.");
    }
  }

  pause(): void {
    this.shouldRestart = false;
    this.intentionalStop = true;
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    this.recognition?.stop();
  }

  resume(handlers: RecognitionHandlers): void {
    this.start(handlers);
  }

  stop(silent = false): void {
    this.shouldRestart = false;
    this.intentionalStop = true;
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    try {
      this.recognition?.abort();
    } catch {
      try {
        this.recognition?.stop();
      } catch {
        // ignore
      }
    }
    this.recognition = null;
    if (!silent) {
      // no-op; callers update UI status
    }
  }
}
