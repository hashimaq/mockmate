/**
 * Pure transcript merge helpers — no browser APIs.
 */
export class TranscriptService {
  static normalize(text: string): string {
    return text.replace(/\s+/g, " ").trim();
  }

  /** Append new speech to an existing answer without losing prior text. */
  static append(existing: string, chunk: string): string {
    const base = existing.trim();
    const next = this.normalize(chunk);
    if (!next) return base;
    if (!base) return next;
    const needsSpace = !/[.!?…]$/.test(base) && !/^[,.;:!?]/.test(next);
    return `${base}${needsSpace ? " " : " "}${next}`.replace(/\s+/g, " ").trim();
  }

  static mergeLive(committed: string, interim: string): string {
    if (!interim.trim()) return committed;
    return this.append(committed, interim);
  }

  static clear(): string {
    return "";
  }
}
