import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  AdminPageHeader,
  AdminPanel,
} from "@/features/admin/components/admin-ui";
import { createClient } from "@/lib/supabase/server";
import { requireStaffProfile } from "@/services/rbac/rbac-service";

export const metadata: Metadata = {
  title: "Admin Reports",
};

export default async function AdminReportsPage() {
  await requireStaffProfile();
  const supabase = await createClient();
  const { data: reports } = await supabase
    .from("reports")
    .select(
      "id, interview_id, user_id, overall_score, status, created_at, error_message",
    )
    .order("created_at", { ascending: false })
    .limit(80);

  const userIds = Array.from(
    new Set((reports ?? []).map((row) => row.user_id)),
  );
  const { data: profiles } =
    userIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, email, full_name")
          .in("id", userIds)
      : { data: [] };

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p] as const),
  );

  return (
    <div>
      <AdminPageHeader
        title="AI reports"
        description="Platform-wide report generation outcomes."
      />
      <AdminPanel title={`Recent reports (${reports?.length ?? 0})`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="px-2 py-2 font-medium">User</th>
                <th className="px-2 py-2 font-medium">Status</th>
                <th className="px-2 py-2 font-medium">Score</th>
                <th className="px-2 py-2 font-medium">Created</th>
                <th className="px-2 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {(reports ?? []).map((row) => {
                const profile = profileMap.get(row.user_id);
                return (
                  <tr
                    key={row.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-2 py-3">
                      <Link
                        href={`/admin/users/${row.user_id}`}
                        className="admin-link"
                      >
                        {profile?.full_name || profile?.email || "User"}
                      </Link>
                      {row.error_message ? (
                        <p className="text-xs text-red-600">
                          {row.error_message}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-2 py-3">
                      <Badge variant="secondary">{row.status}</Badge>
                    </td>
                    <td className="px-2 py-3 tabular-nums">
                      {row.overall_score ?? "—"}
                    </td>
                    <td className="px-2 py-3 text-muted-foreground">
                      {new Date(row.created_at).toLocaleString()}
                    </td>
                    <td className="px-2 py-3 text-right">
                      <Link
                        href={`/admin/interviews/${row.interview_id}`}
                        className="text-xs font-semibold admin-link"
                      >
                        Open interview
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {(reports ?? []).length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-2 py-8 text-center text-muted-foreground"
                  >
                    No reports yet.
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
