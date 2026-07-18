import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import {
  AdminPageHeader,
  AdminPanel,
} from "@/features/admin/components/admin-ui";
import { AdminUserService } from "@/services/admin/admin-user-service";
import { requireStaffProfile } from "@/services/rbac/rbac-service";

export const metadata: Metadata = {
  title: "User detail",
};

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  await requireStaffProfile();
  const { userId } = await params;
  const detail = await new AdminUserService().getUserDetail(userId);
  if (!detail) notFound();

  const { profile, resume, interviews, reports, activity, lastSignInAt } =
    detail;

  return (
    <div>
      <AdminPageHeader
        title={profile.full_name || profile.email}
        description="Full profile, resume, interviews, reports, and activity."
        actions={
          <Link
            href="/admin/users"
            className="rounded-lg border border-border px-3 py-2 text-xs font-semibold"
          >
            Back to users
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <AdminPanel title="Profile" className="lg:col-span-1">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium">{profile.email}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Role</dt>
              <dd>
                <Badge variant="secondary" className="capitalize">
                  {profile.role.replace("_", " ")}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="capitalize">{profile.status}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Joined</dt>
              <dd>{new Date(profile.created_at).toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Last sign-in</dt>
              <dd>
                {lastSignInAt
                  ? new Date(lastSignInAt).toLocaleString()
                  : "—"}
              </dd>
            </div>
          </dl>
        </AdminPanel>

        <AdminPanel title="Resume" className="lg:col-span-2">
          {resume ? (
            <div className="text-sm">
              <p className="font-medium">{resume.file_name}</p>
              <p className="mt-1 text-muted-foreground">
                Status: {resume.analysis_status} ·{" "}
                {new Date(resume.uploaded_at).toLocaleString()} ·{" "}
                {Math.round(resume.file_size / 1024)} KB
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No resume uploaded</p>
          )}
        </AdminPanel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <AdminPanel title="Interview history">
          <ul className="space-y-2 text-sm">
            {interviews.map((item) => (
              <li key={item.id} className="flex justify-between gap-3">
                <Link
                  href={`/admin/interviews/${item.id}`}
                  className="truncate admin-link"
                >
                  {item.title}
                </Link>
                <span className="shrink-0 text-muted-foreground">
                  {item.score ?? "—"}
                </span>
              </li>
            ))}
            {interviews.length === 0 ? (
              <li className="text-muted-foreground">No interviews</li>
            ) : null}
          </ul>
        </AdminPanel>

        <AdminPanel title="Reports">
          <ul className="space-y-2 text-sm">
            {reports.map((item) => (
              <li key={item.id} className="flex justify-between gap-3">
                <Link
                  href={`/admin/interviews/${item.interview_id}`}
                  className="truncate admin-link"
                >
                  {item.status} · {item.overall_score ?? "—"}
                </Link>
                <span className="shrink-0 text-muted-foreground">
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </li>
            ))}
            {reports.length === 0 ? (
              <li className="text-muted-foreground">No reports</li>
            ) : null}
          </ul>
        </AdminPanel>
      </div>

      <div className="mt-4">
        <AdminPanel
          title="Activity & login signals"
          description="Recent activity log entries for this account (includes product events)."
        >
          <ul className="space-y-2 text-sm">
            {activity.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-0.5 border-b border-border py-2 last:border-0 sm:flex-row sm:justify-between"
              >
                <span>
                  <span className="font-medium">{item.action}</span>
                  {item.description ? (
                    <span className="text-muted-foreground">
                      {" "}
                      — {item.description}
                    </span>
                  ) : null}
                </span>
                <span className="text-muted-foreground">
                  {new Date(item.created_at).toLocaleString()}
                </span>
              </li>
            ))}
            {activity.length === 0 ? (
              <li className="text-muted-foreground">No activity yet</li>
            ) : null}
          </ul>
        </AdminPanel>
      </div>
    </div>
  );
}
