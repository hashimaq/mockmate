import "server-only";

import { Resend } from "resend";

import { SITE_URL } from "@/lib/constants";
import { captureException } from "@/lib/monitoring/logger";
import { AdminNotificationService } from "@/services/admin/admin-notification-service";

export type AdminEmailEventType =
  | "user_registered"
  | "resume_uploaded"
  | "resume_analyzed"
  | "interview_completed"
  | "voice_interview_completed"
  | "company_interview_completed"
  | "ai_report_generated"
  | "critical_ai_error"
  | "system_error"
  | "contact_form_submitted";

export type AdminEmailEvent = {
  type: AdminEmailEventType;
  userName?: string | null;
  userEmail: string;
  interviewType?: string | null;
  targetCompany?: string | null;
  overallScore?: number | null;
  details?: string | null;
  occurredAt?: Date;
};

const EVENT_LABELS: Record<AdminEmailEventType, string> = {
  user_registered: "New user registered",
  resume_uploaded: "Resume uploaded",
  resume_analyzed: "Resume analyzed",
  interview_completed: "Interview completed",
  voice_interview_completed: "Voice interview completed",
  company_interview_completed: "Company interview completed",
  ai_report_generated: "AI report generated",
  critical_ai_error: "Critical AI error",
  system_error: "System error",
  contact_form_submitted: "Contact form submitted",
};

function getResendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}

function buildHtml(event: AdminEmailEvent): string {
  const when = (event.occurredAt ?? new Date()).toLocaleString();
  const adminUrl = `${SITE_URL}/admin`;
  const rows = [
    ["User Name", event.userName?.trim() || "—"],
    ["User Email", event.userEmail],
    ["Event Type", EVENT_LABELS[event.type]],
    ["Date & Time", when],
    ["Interview Type", event.interviewType || "—"],
    ["Target Company", event.targetCompany || "—"],
    [
      "Overall Score",
      event.overallScore === null || event.overallScore === undefined
        ? "—"
        : String(Math.round(event.overallScore)),
    ],
  ];

  const detailBlock = event.details
    ? `<p style="margin:16px 0 0;color:#444;font-size:14px;"><strong>Details:</strong> ${escapeHtml(event.details)}</p>`
    : "";

  return `
  <div style="font-family:Inter,Segoe UI,Arial,sans-serif;background:#f6f7f8;padding:24px;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:24px;">
      <p style="margin:0 0 8px;color:#059669;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">MockMate Admin</p>
      <h1 style="margin:0 0 16px;font-size:22px;color:#111;">${escapeHtml(EVENT_LABELS[event.type])}</h1>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        ${rows
          .map(
            ([label, value]) => `
          <tr>
            <td style="padding:8px 0;color:#6b7280;width:40%;">${escapeHtml(label)}</td>
            <td style="padding:8px 0;color:#111;font-weight:600;">${escapeHtml(String(value))}</td>
          </tr>`,
          )
          .join("")}
      </table>
      ${detailBlock}
      <a href="${adminUrl}" style="display:inline-block;margin-top:24px;background:#059669;color:#fff;text-decoration:none;padding:12px 18px;border-radius:12px;font-weight:600;">
        Open Admin Dashboard
      </a>
    </div>
  </div>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Fire-and-forget owner notification email via Resend.
 * No-ops when RESEND_API_KEY / ADMIN_NOTIFICATION_EMAIL are missing.
 */
export async function notifyAdminEvent(event: AdminEmailEvent): Promise<void> {
  const title = EVENT_LABELS[event.type];

  // In-app notification center (best-effort; independent of Resend)
  void new AdminNotificationService()
    .create({
      eventType: event.type,
      title,
      body: event.details ?? null,
      userEmail: event.userEmail,
      userName: event.userName ?? null,
      metadata: {
        interviewType: event.interviewType ?? null,
        targetCompany: event.targetCompany ?? null,
        overallScore: event.overallScore ?? null,
      },
    })
    .catch(() => undefined);

  try {
    const resend = getResendClient();
    const to = process.env.ADMIN_NOTIFICATION_EMAIL?.trim();
    if (!resend || !to) return;

    const from =
      process.env.RESEND_FROM_EMAIL?.trim() ||
      "MockMate <onboarding@resend.dev>";

    await resend.emails.send({
      from,
      to: [to],
      subject: `[MockMate] ${title}`,
      html: buildHtml(event),
    });
  } catch (error) {
    captureException(error, { source: "notifyAdminEvent", type: event.type });
  }
}
