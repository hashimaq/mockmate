"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  markAllNotificationsReadAction,
  setNotificationStatusAction,
} from "@/features/admin/actions/admin-ops-actions";
import { AdminPanel } from "@/features/admin/components/admin-ui";
import type { AdminNotification } from "@/types/database";

export function AdminNotificationsClient({
  items,
  total,
  unreadCount,
  search,
  status,
  eventType,
  page,
  pageSize,
}: {
  items: AdminNotification[];
  total: number;
  unreadCount: number;
  search: string;
  status: string;
  eventType: string;
  page: number;
  pageSize: number;
}) {
  const [pending, startTransition] = useTransition();
  const pages = Math.max(1, Math.ceil(total / pageSize));

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
      <AdminPanel
        title={`Inbox (${total})`}
        description={`${unreadCount} unread`}
        actions={
          <Button
            size="sm"
            variant="outline"
            disabled={pending || unreadCount === 0}
            onClick={() => run(() => markAllNotificationsReadAction())}
          >
            Mark all read
          </Button>
        }
      >
        <form
          method="get"
          action="/admin/notifications"
          className="mb-4 grid gap-3 md:grid-cols-[1fr_160px_180px_auto]"
        >
          <div className="space-y-2">
            <Label htmlFor="q">Search</Label>
            <Input
              id="q"
              name="q"
              defaultValue={search}
              placeholder="Title, email, body"
            />
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
              <option value="unread">Unread</option>
              <option value="read">Read</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Event</Label>
            <select
              id="type"
              name="type"
              defaultValue={eventType}
              className="flex h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
            >
              <option value="all">All events</option>
              <option value="user_registered">User registered</option>
              <option value="resume_uploaded">Resume uploaded</option>
              <option value="resume_analyzed">Resume analyzed</option>
              <option value="interview_completed">Interview completed</option>
              <option value="ai_report_generated">AI report</option>
              <option value="critical_ai_error">Critical AI error</option>
              <option value="contact_form_submitted">Contact form</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              Filter
            </Button>
          </div>
        </form>

        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li key={item.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-sm">{item.title}</p>
                  <Badge variant="secondary">{item.status}</Badge>
                  <span className="text-[11px] text-muted-foreground">
                    {item.event_type}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.user_name || "—"} · {item.user_email || "—"}
                </p>
                {item.body ? (
                  <p className="mt-1 text-sm">{item.body}</p>
                ) : null}
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(item.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {item.status !== "read" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() =>
                      run(() => setNotificationStatusAction(item.id, "read"))
                    }
                  >
                    Mark read
                  </Button>
                ) : null}
                {item.status !== "unread" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() =>
                      run(() => setNotificationStatusAction(item.id, "unread"))
                    }
                  >
                    Mark unread
                  </Button>
                ) : null}
                {item.status !== "archived" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() =>
                      run(() =>
                        setNotificationStatusAction(item.id, "archived"),
                      )
                    }
                  >
                    Archive
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
          {items.length === 0 ? (
            <li className="py-8 text-center text-sm text-muted-foreground">
              No notifications yet. Events appear here when users register,
              upload resumes, complete interviews, or when AI errors occur.
              Run migration <code>011_admin_console.sql</code> if this stays empty
              after activity.
            </li>
          ) : null}
        </ul>

        <div className="mt-4 flex justify-between text-sm text-muted-foreground">
          <span>
            Page {page} of {pages}
          </span>
        </div>
      </AdminPanel>
    </div>
  );
}
