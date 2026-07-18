import "server-only";

import { GoogleGenAI } from "@google/genai";
import type { z } from "zod";

import { aiRateLimiter } from "@/services/ai/rate-limiter";
import { ResponseValidator } from "@/services/ai/response-validator";

export class AIServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIServiceError";
  }
}

type GenerateJsonInput<T> = {
  system: string;
  user: string;
  schema: z.ZodType<T>;
  rateLimitKey: string;
  temperature?: number;
  /** Bound output size — smaller = faster. */
  maxOutputTokens?: number;
};

/**
 * Default: flash-lite for speed. Override with GEMINI_MODEL=gemini-3.5-flash
 * when you want higher quality and can tolerate slower responses.
 */
const DEFAULT_MODEL = "gemini-3.1-flash-lite";

export class AIService {
  private readonly client: GoogleGenAI;
  private readonly model: string;

  constructor(options?: { apiKey?: string; model?: string }) {
    const apiKey = options?.apiKey ?? process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new AIServiceError(
        "GEMINI_API_KEY is not configured. Add it to your server environment.",
      );
    }

    this.client = new GoogleGenAI({ apiKey });
    this.model = options?.model ?? process.env.GEMINI_MODEL ?? DEFAULT_MODEL;
  }

  get modelName(): string {
    return this.model;
  }

  async generateJson<T>(input: GenerateJsonInput<T>): Promise<T> {
    aiRateLimiter.assertAllowed(input.rateLimitKey);

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        // thinkingBudget: 0 skips deep reasoning (major latency win when supported)
        const useThinkingOff = attempt === 0;
        const response = await this.client.models.generateContent({
          model: this.model,
          contents: input.user,
          config: {
            systemInstruction: input.system,
            temperature: input.temperature ?? 0.3,
            responseMimeType: "application/json",
            maxOutputTokens: input.maxOutputTokens ?? 2048,
            ...(useThinkingOff
              ? { thinkingConfig: { thinkingBudget: 0 } }
              : {}),
          },
        });

        const text = response.text?.trim();
        if (!text) {
          throw new AIServiceError("Gemini returned an empty response");
        }

        return ResponseValidator.parseAndValidate(input.schema, text);
      } catch (error) {
        lastError =
          error instanceof Error
            ? error
            : new AIServiceError("Gemini request failed");

        const message = lastError.message.toLowerCase();
        const nonRetryable =
          message.includes("api key") ||
          message.includes("not found") ||
          message.includes("permission") ||
          message.includes("rate limit");

        if (attempt === 0 && !nonRetryable) {
          await new Promise((resolve) => setTimeout(resolve, 200));
          continue;
        }
        break;
      }
    }

    throw new AIServiceError(
      lastError?.message ?? "Gemini request failed after retry",
    );
  }
}

let singleton: AIService | null = null;

export function getAIService(): AIService {
  if (!singleton) {
    singleton = new AIService();
  }
  return singleton;
}
