"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePlatformSettingsAction } from "@/features/admin/actions/admin-ops-actions";
import { AdminPanel, AdminStatusPill } from "@/features/admin/components/admin-ui";
import type { PlatformGeneralSettings } from "@/types/database";

export function AdminSettingsForm({
  initial,
  canEdit,
  environment,
}: {
  initial: PlatformGeneralSettings;
  canEdit: boolean;
  environment: Record<string, boolean>;
}) {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState(initial);

  function save() {
    startTransition(async () => {
      const result = await updatePlatformSettingsAction(form);
      if (!result.success) {
        toast.error(result.error ?? "Save failed");
        return;
      }
      toast.success(result.message ?? "Saved");
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <AdminPanel
        title="General settings"
        description={
          canEdit
            ? "Super Admin can update platform defaults."
            : "Only Super Admin can change these values."
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="applicationName">Application name</Label>
            <Input
              id="applicationName"
              value={form.applicationName}
              disabled={!canEdit || pending}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  applicationName: e.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supportEmail">Support email</Label>
            <Input
              id="supportEmail"
              type="email"
              value={form.supportEmail}
              disabled={!canEdit || pending}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, supportEmail: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notificationEmail">Notification email</Label>
            <Input
              id="notificationEmail"
              type="email"
              value={form.notificationEmail}
              disabled={!canEdit || pending}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  notificationEmail: e.target.value,
                }))
              }
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.maintenanceMode}
              disabled={!canEdit || pending}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  maintenanceMode: e.target.checked,
                }))
              }
            />
            Maintenance mode (architecture flag — enforce at edge later)
          </label>
          {canEdit ? (
            <Button
              onClick={save}
              disabled={pending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Save settings
            </Button>
          ) : null}
        </div>
      </AdminPanel>

      <AdminPanel
        title="AI & environment architecture"
        description="Runtime secrets stay in .env — never exposed in the browser."
      >
        <ul className="space-y-2 text-sm">
          {Object.entries(environment).map(([key, ok]) => (
            <li key={key} className="flex items-center justify-between gap-3">
              <span className="font-mono text-xs">{key}</span>
              <AdminStatusPill
                status={ok ? "ok" : "warn"}
                label={ok ? "configured" : "missing"}
              />
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">
          AI model selection continues to use <code>GEMINI_MODEL</code>. Daily
          digest cron uses <code>CRON_SECRET</code> at{" "}
          <code>/api/cron/daily-digest</code>.
        </p>
      </AdminPanel>
    </div>
  );
}
