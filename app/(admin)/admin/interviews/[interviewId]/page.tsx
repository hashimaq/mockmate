import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import {
  AdminPageHeader,
  AdminPanel,
} from "@/features/admin/components/admin-ui";
import { AdminInterviewService } from "@/services/admin/admin-interview-service";
import { requireStaffProfile } from "@/services/rbac/rbac-service";

export const metadata: Metadata = {
  title: "Interview detail",
};

export default async function AdminInterviewDetailPage({
  params,
}: {
  params: Promise<{ interviewId: string }>;
}) {
  await requireStaffProfile();
  const { interviewId } = await params;
  const detail = await new AdminInterviewService().getDetail(interviewId);
  if (!detail.interview) notFound();

  const { interview, report, answers } = detail;
  const metadata =
    report?.metadata && typeof report.metadata === "object"
      ? (report.metadata as Record<string, unknown>)
      : {};

  return (
    <div>
      <AdminPageHeader
        title={interview.title}
        description="Transcript, AI report, and resume alignment signals."
        actions={
          <Link
            href="/admin/interviews"
            className="rounded-lg border border-border px-3 py-2 text-xs font-semibold"
          >
            Back to interviews
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <AdminPanel title="Session" className="lg:col-span-1">
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-muted-foreground">User</dt>
              <dd>
                <Link
                  href={`/admin/users/${interview.user_id}`}
                  className="admin-link"
                >
                  {interview.user_name || interview.user_email}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <Badge variant="secondary">{interview.status}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Score</dt>
              <dd className="tabular-nums">{interview.score ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Company</dt>
              <dd>{interview.target_company || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Type</dt>
              <dd>{interview.interview_type}</dd>
            </div>
          </dl>
        </AdminPanel>

        <AdminPanel title="AI report" className="lg:col-span-2">
          {report ? (
            <div className="space-y-3 text-sm">
              <p>
                <span className="text-muted-foreground">Status:</span>{" "}
                {report.status} · Overall{" "}
                <span className="font-semibold tabular-nums">
                  {report.overall_score ?? "—"}
                </span>
              </p>
              <p>{report.summary || "No summary"}</p>
              {report.strengths?.length ? (
                <div>
                  <p className="font-medium">Strengths</p>
                  <ul className="mt-1 list-disc pl-5 text-muted-foreground">
                    {report.strengths.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {"companyReadiness" in metadata ||
              "resumeAlignment" in metadata ||
              "resume_alignment" in metadata ? (
                <div className="rounded-lg bg-muted p-3">
                  <p className="font-medium">Resume / company alignment</p>
                  <pre className="mt-2 overflow-x-auto text-xs text-muted-foreground">
                    {JSON.stringify(
                      {
                        companyReadiness: metadata.companyReadiness,
                        resumeAlignment:
                          metadata.resumeAlignment ?? metadata.resume_alignment,
                      },
                      null,
                      2,
                    )}
                  </pre>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No explicit alignment block in report metadata.
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No report generated yet.
            </p>
          )}
        </AdminPanel>
      </div>

      <div className="mt-4">
        <AdminPanel title="Transcript">
          <ol className="space-y-4">
            {answers.map((item, index) => (
              <li
                key={`${item.order_index}-${index}`}
                className="rounded-lg border border-border p-3 text-sm"
              >
                <p className="font-medium">
                  Q{index + 1}. {item.prompt}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-foreground">
                  {item.content || "(no answer)"}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Score: {item.score ?? "—"}
                  {item.feedback ? ` · ${item.feedback}` : ""}
                </p>
              </li>
            ))}
            {answers.length === 0 ? (
              <li className="text-muted-foreground">No Q&A recorded</li>
            ) : null}
          </ol>
        </AdminPanel>
      </div>
    </div>
  );
}
