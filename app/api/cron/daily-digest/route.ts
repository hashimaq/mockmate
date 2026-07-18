import { NextResponse } from "next/server";
import { Resend } from "resend";

import { SITE_URL } from "@/lib/constants";
import { AdminAnalyticsService } from "@/services/admin/admin-analytics-service";
import {
  buildDailyDigestHtml,
  type DailyDigestPayload,
} from "@/services/notifications/daily-digest";

function authorize(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

async function handle(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = await new AdminAnalyticsService().buildDailyDigestStats();
  const payload: DailyDigestPayload = {
    stats,
    generatedAt: new Date().toISOString(),
  };

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to = process.env.ADMIN_NOTIFICATION_EMAIL?.trim();

  if (apiKey && to) {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from:
        process.env.RESEND_FROM_EMAIL?.trim() ||
        "MockMate <onboarding@resend.dev>",
      to: [to],
      subject: `[MockMate] Daily digest · ${stats.date}`,
      html: buildDailyDigestHtml(payload),
    });
  }

  return NextResponse.json({
    ok: true,
    adminUrl: `${SITE_URL}/admin`,
    emailed: Boolean(apiKey && to),
    payload,
  });
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
