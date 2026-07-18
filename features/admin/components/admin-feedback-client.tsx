"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateFeedbackStatusAction } from "@/features/admin/actions/admin-ops-actions";
import { AdminPanel } from "@/features/admin/components/admin-ui";
import type { PlatformFeedback } from "@/types/database";

export function AdminFeedbackClient({
  items,
  total,
  search,
  category,
  status,
}: {
  items: PlatformFeedback[];
  total: number;
  search: string;
  category: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();

  function run(
    action: () => Promise<{ success: boolean; error?: string; message?: string }>,
  ) {
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        toast.error(result.error ?? "Failed");
        return;
      }
      toast.success(result.message ?? "Updated");
      window.location.reload();
    });
  }

  return (
    <div className="space-y-4">
      <AdminPanel title="Filters">
        <form
          method="get"
          action="/admin/feedback"
          className="grid gap-3 md:grid-cols-[1fr_180px_160px_auto]"
        >
          <div className="space-y-2">
            <Label htmlFor="q">Search</Label>
            <Input id="q" name="q" defaultValue={search} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              name="category"
              defaultValue={category}
              className="flex h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
            >
              <option value="all">All</option>
              <option value="contact">Contact</option>
              <option value="feature_request">Feature request</option>
              <option value="bug_report">Bug report</option>
              <option value="user_feedback">User feedback</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              defaultValue={status}
              className="flex h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
            >
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="in_progress">In progress</option>
              <option value="resolved">Resolved</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              Apply
            </Button>
          </div>
        </form>
      </AdminPanel>

      <AdminPanel
        title={`Feedback inbox (${total})`}
        description="Contact messages, feature requests, bug reports, and user feedback. Reply architecture: update status + admin notes; email reply can be wired later."
      >
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li key={item.id} className="py-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-sm">{item.subject}</p>
                <Badge variant="secondary">{item.category}</Badge>
                <Badge variant="outline">{item.status}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.submitter_name || "—"} · {item.submitter_email || "—"} ·{" "}
                {new Date(item.created_at).toLocaleString()}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm">{item.message}</p>
              {item.admin_notes ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Notes: {item.admin_notes}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() =>
                    run(() => updateFeedbackStatusAction(item.id, "in_progress"))
                  }
                >
                  In progress
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() =>
                    run(() => updateFeedbackStatusAction(item.id, "resolved"))
                  }
                >
                  Resolve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() =>
                    run(() => updateFeedbackStatusAction(item.id, "archived"))
                  }
                >
                  Archive
                </Button>
              </div>
            </li>
          ))}
          {items.length === 0 ? (
            <li className="py-8 text-center text-sm text-muted-foreground">
              No feedback yet. Apply migration <code>011_admin_console.sql</code>,
              then insert rows into <code>platform_feedback</code> from your
              contact form via <code>notifyAdminEvent</code> + table insert.
            </li>
          ) : null}
        </ul>
      </AdminPanel>
    </div>
  );
}
