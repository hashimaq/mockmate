import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AdminPageHeader,
  AdminPanel,
} from "@/features/admin/components/admin-ui";
import { AdminInterviewService } from "@/services/admin/admin-interview-service";
import { requireStaffProfile } from "@/services/rbac/rbac-service";
import type { InterviewStatus } from "@/types/database";

export const metadata: Metadata = {
  title: "Admin Interviews",
};

type SearchParams = Promise<{
  q?: string;
  status?: string;
  mode?: string;
  page?: string;
}>;

export default async function AdminInterviewsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireStaffProfile();
  const params = await searchParams;
  const result = await new AdminInterviewService().list({
    search: params.q,
    status: (params.status as InterviewStatus | "all" | undefined) ?? "all",
    mode:
      (params.mode as "all" | "resume" | "company" | "standard" | undefined) ??
      "all",
    page: Number(params.page ?? "1") || 1,
  });

  const exportRows = [
    ["id", "user_email", "title", "status", "score", "company", "created_at"],
    ...result.items.map((row) => [
      row.id,
      row.user_email ?? "",
      row.title,
      row.status,
      row.score ?? "",
      row.target_company ?? "",
      row.created_at,
    ]),
  ];
  const csv = exportRows
    .map((cols) =>
      cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");

  return (
    <div>
      <AdminPageHeader
        title="Interview management"
        description="Inspect every interview across the platform — transcripts, scores, and reports."
        actions={
          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`}
            download={`mockmate-interviews-page-${result.page}.csv`}
            className="rounded-lg border border-border px-3 py-2 text-xs font-semibold"
          >
            Export page CSV
          </a>
        }
      />

      <AdminPanel title="Filters" className="mb-4">
        <form
          method="get"
          action="/admin/interviews"
          className="grid gap-3 md:grid-cols-[1fr_160px_160px_auto]"
        >
          <div className="space-y-2">
            <Label htmlFor="q">Search</Label>
            <Input
              id="q"
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Title, role, company"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              defaultValue={params.status ?? "all"}
              className="flex h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
            >
              <option value="all">All</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In progress</option>
              <option value="draft">Draft</option>
              <option value="abandoned">Abandoned</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="mode">Mode</Label>
            <select
              id="mode"
              name="mode"
              defaultValue={params.mode ?? "all"}
              className="flex h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
            >
              <option value="all">All modes</option>
              <option value="standard">Standard</option>
              <option value="resume">Resume</option>
              <option value="company">Company</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              Apply
            </Button>
          </div>
        </form>
      </AdminPanel>

      <AdminPanel title={`Interviews (${result.total})`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="px-2 py-2 font-medium">Interview</th>
                <th className="px-2 py-2 font-medium">User</th>
                <th className="px-2 py-2 font-medium">Status</th>
                <th className="px-2 py-2 font-medium">Score</th>
                <th className="px-2 py-2 font-medium">Company</th>
                <th className="px-2 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {result.items.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-2 py-3">
                    <p className="font-medium">{row.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.role_target || "—"} ·{" "}
                      {new Date(row.created_at).toLocaleString()}
                    </p>
                  </td>
                  <td className="px-2 py-3">
                    <Link
                      href={`/admin/users/${row.user_id}`}
                      className="admin-link"
                    >
                      {row.user_name || row.user_email || "User"}
                    </Link>
                  </td>
                  <td className="px-2 py-3">
                    <Badge variant="secondary">{row.status}</Badge>
                  </td>
                  <td className="px-2 py-3 tabular-nums">{row.score ?? "—"}</td>
                  <td className="px-2 py-3">{row.target_company || "—"}</td>
                  <td className="px-2 py-3 text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/interviews/${row.id}`}>Open</Link>
                    </Button>
                  </td>
                </tr>
              ))}
              {result.items.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-2 py-8 text-center text-muted-foreground"
                  >
                    No interviews found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </AdminPanel>
    </div>
  );
}
