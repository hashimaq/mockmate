/**
 * Pure transcript merge helpers — no browser APIs.
 */
export class TranscriptService {
  static normalize(text: string): string {
    return text.replace(/\s+/g, " ").trim();
  }

  /** Append new speech without duplicating already-committed phrases. */
  static append(existing: string, chunk: string): string {
    const base = this.normalize(existing);
    const next = this.normalize(chunk);
    if (!next) return base;
    if (!base) return next;

    const baseLower = base.toLowerCase();
    const nextLower = next.toLowerCase();

    // Exact duplicate / already ends with this chunk
    if (baseLower === nextLower || baseLower.endsWith(nextLower)) {
      return base;
    }

    // Chunk already contains the full base (restart re-emit of growing string)
    if (nextLower.startsWith(baseLower) && nextLower.length > baseLower.length) {
      return next;
    }

    // Overlap: end of base matches start of next
    const maxOverlap = Math.min(base.length, next.length);
    for (let size = maxOverlap; size >= 8; size -= 1) {
      const tail = baseLower.slice(-size);
      if (nextLower.startsWith(tail)) {
        const remainder = next.slice(size).trim();
        if (!remainder) return base;
        return this.normalize(`${base} ${remainder}`);
      }
    }

    return this.normalize(`${base} ${next}`);
  }

  static mergeLive(committed: string, interim: string): string {
    if (!interim.trim()) return committed;
    return this.append(committed, interim);
  }

  static clear(): string {
    return "";
  }
}
