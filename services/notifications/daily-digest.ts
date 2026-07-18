import "server-only";

/**
 * Daily digest architecture — ready for Vercel Cron.
 * Invoke via GET/POST /api/cron/daily-digest with Authorization: Bearer CRON_SECRET
 */

export type DailyDigestStats = {
  date: string;
  newUsers: number;
  interviews: number;
  resumeUploads: number;
  companyInterviews: number;
  voiceInterviews: number;
  averageScore: number | null;
  topRoles: Array<{ role: string; count: number }>;
  topCompanies: Array<{ company: string; count: number }>;
  aiErrors: number;
  systemStatus: "healthy" | "degraded" | "unknown";
};

export type DailyDigestPayload = {
  stats: DailyDigestStats;
  generatedAt: string;
};

export function buildDailyDigestHtml(payload: DailyDigestPayload): string {
  const { stats } = payload;
  const line = (label: string, value: string | number) =>
    `<tr><td style="padding:8px 0;color:#6b7280;">${label}</td><td style="padding:8px 0;font-weight:600;color:#111;">${value}</td></tr>`;

  return `
  <div style="font-family:Inter,Segoe UI,Arial,sans-serif;padding:24px;background:#f6f7f8;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;border:1px solid #e5e7eb;padding:24px;">
      <h1 style="margin:0 0 8px;font-size:22px;">MockMate Daily Digest</h1>
      <p style="margin:0 0 16px;color:#6b7280;">${stats.date} · ${stats.systemStatus}</p>
      <table style="width:100%;font-size:14px;">
        ${line("New Users", stats.newUsers)}
        ${line("Interviews", stats.interviews)}
        ${line("Resume Uploads", stats.resumeUploads)}
        ${line("Company Interviews", stats.companyInterviews)}
        ${line("Voice Interviews", stats.voiceInterviews)}
        ${line("Average Score", stats.averageScore ?? "—")}
        ${line("AI Errors", stats.aiErrors)}
      </table>
      <p style="margin:16px 0 0;color:#6b7280;font-size:13px;">
        Top roles: ${stats.topRoles.map((r) => `${r.role} (${r.count})`).join(", ") || "—"}
      </p>
      <p style="margin:8px 0 0;color:#6b7280;font-size:13px;">
        Top companies: ${stats.topCompanies.map((c) => `${c.company} (${c.count})`).join(", ") || "—"}
      </p>
    </div>
  </div>`;
}
