import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { logger } from "@/lib/monitoring/logger";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

/**
 * Lightweight notification channel via activity_logs.
 * Keeps UI free of Gemini/side-effect coupling.
 */
export class NotificationService {
  constructor(private readonly supabase: Client) {}

  async notify(input: {
    userId: string;
    interviewId?: string | null;
    action: string;
    description: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const { error } = await this.supabase.from("activity_logs").insert({
      user_id: input.userId,
      interview_id: input.interviewId ?? null,
      action: input.action,
      description: input.description,
      metadata: input.metadata ?? {},
    });

    if (error) {
      // Notifications must never break the primary workflow
      logger.warn("Notification insert failed", {
        source: "NotificationService",
        action: input.action,
        message: error.message,
      });
    }
  }
}
