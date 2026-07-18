import "server-only";

import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

import {
  RESUME_MIME_TYPES,
  type ResumeMimeType,
} from "@/services/resumes/schemas";

export class ResumeParser {
  static isSupportedMime(mime: string): mime is ResumeMimeType {
    return (RESUME_MIME_TYPES as readonly string[]).includes(mime);
  }

  static async extractText(
    buffer: Buffer,
    mimeType: ResumeMimeType,
  ): Promise<string> {
    if (mimeType === "application/pdf") {
      const parser = new PDFParse({ data: buffer });
      try {
        const result = await parser.getText();
        return this.normalize(result.text ?? "");
      } finally {
        await parser.destroy().catch(() => undefined);
      }
    }

    const result = await mammoth.extractRawText({ buffer });
    return this.normalize(result.value ?? "");
  }

  private static normalize(text: string): string {
    return text
      .replace(/\u0000/g, "")
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .slice(0, 60000);
  }
}
