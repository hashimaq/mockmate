import "server-only";

type Bucket = {
  timestamps: number[];
};

/**
 * Simple in-memory sliding-window limiter for serverless-friendly soft rate control.
 * Resets per process instance; still blocks burst abuse within a warm instance.
 */
export class RateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(
    private readonly maxRequests: number,
    private readonly windowMs: number,
  ) {}

  assertAllowed(key: string): void {
    const now = Date.now();
    const bucket = this.buckets.get(key) ?? { timestamps: [] };
    bucket.timestamps = bucket.timestamps.filter(
      (ts) => now - ts < this.windowMs,
    );

    if (bucket.timestamps.length >= this.maxRequests) {
      throw new Error(
        "AI rate limit reached. Please wait a moment and try again.",
      );
    }

    bucket.timestamps.push(now);
    this.buckets.set(key, bucket);
  }
}

export const aiRateLimiter = new RateLimiter(12, 60_000);
