import "server-only";

import type { z } from "zod";

export class ResponseValidator {
  static parseJsonText(text: string): unknown {
    const trimmed = text.trim();
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = fenced?.[1]?.trim() ?? trimmed;

    try {
      return JSON.parse(candidate) as unknown;
    } catch {
      const start = candidate.indexOf("{");
      const end = candidate.lastIndexOf("}");
      if (start >= 0 && end > start) {
        return JSON.parse(candidate.slice(start, end + 1)) as unknown;
      }
      throw new Error("Gemini returned invalid JSON");
    }
  }

  static validate<T>(schema: z.ZodType<T>, payload: unknown): T {
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      const detail = parsed.error.issues[0]?.message ?? "schema mismatch";
      throw new Error(`Gemini response failed validation: ${detail}`);
    }
    return parsed.data;
  }

  static parseAndValidate<T>(schema: z.ZodType<T>, text: string): T {
    const json = this.parseJsonText(text);
    return this.validate(schema, json);
  }
}
