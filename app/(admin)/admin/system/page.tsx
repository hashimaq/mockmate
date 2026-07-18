import type { Metadata } from "next";

import {
  AdminPageHeader,
  AdminPanel,
  AdminStatCard,
  AdminStatusPill,
  formatBytes,
} from "@/features/admin/components/admin-ui";
import { AdminAnalyticsService } from "@/services/admin/admin-analytics-service";
import { AdminSettingsService } from "@/services/admin/admin-settings-service";
import { requireStaffProfile } from "@/services/rbac/rbac-service";

export const metadata: Metadata = {
  title: "System Health",
};

export default async function AdminSystemPage() {
  await requireStaffProfile();
  const [health, env] = await Promise.all([
    new AdminAnalyticsService().getSystemHealth(),
    Promise.resolve(new AdminSettingsService().getEnvironmentStatus()),
  ]);

  return (
    <div>
      <AdminPageHeader
        title="System health"
        description="Operational signals for database, storage, AI, and environment readiness."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Database"
          value={health.databaseStatus === "ok" ? "Healthy" : "Error"}
          hint={`${health.databaseLatencyMs} ms · ${health.aiResponseHint}`}
          tone={health.databaseStatus === "ok" ? "ok" : "danger"}
        />
        <AdminStatCard
          label="Storage usage"
          value={formatBytes(health.storageUsageBytes)}
          hint={`Status: ${health.storageStatus}`}
          tone={health.storageStatus === "ok" ? "ok" : "warn"}
        />
        <AdminStatCard
          label="AI API"
          value={health.aiApiStatus}
          hint={
            health.avgReportGenerationMs
              ? `Avg report gen ${health.avgReportGenerationMs} ms`
              : "No completed report timings yet"
          }
          tone={
            health.aiApiStatus === "ok"
              ? "ok"
              : health.aiApiStatus === "degraded"
                ? "warn"
                : "danger"
          }
        />
        <AdminStatCard
          label="Failed requests"
          value={health.failedRequests}
          hint={`Server: ${health.serverHealth}`}
          tone={health.failedRequests > 0 ? "danger" : "ok"}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <AdminPanel title="Service status">
          <ul className="space-y-3 text-sm">
            <li className="flex items-center justify-between">
              <span>Database</span>
              <AdminStatusPill
                status={health.databaseStatus === "ok" ? "ok" : "error"}
                label={health.databaseStatus}
              />
            </li>
            <li className="flex items-center justify-between">
              <span>Storage</span>
              <AdminStatusPill
                status={
                  health.storageStatus === "ok"
                    ? "ok"
                    : health.storageStatus === "warning"
                      ? "warn"
                      : "error"
                }
                label={health.storageStatus}
              />
            </li>
            <li className="flex items-center justify-between">
              <span>AI API</span>
              <AdminStatusPill
                status={
                  health.aiApiStatus === "ok"
                    ? "ok"
                    : health.aiApiStatus === "degraded"
                      ? "warn"
                      : "error"
                }
                label={health.aiApiStatus}
              />
            </li>
            <li className="flex items-center justify-between">
              <span>Server</span>
              <AdminStatusPill
                status={health.serverHealth === "ok" ? "ok" : "warn"}
                label={health.serverHealth}
              />
            </li>
            <li className="flex items-center justify-between">
              <span>Environment</span>
              <AdminStatusPill
                status={health.environmentReady ? "ok" : "warn"}
                label={health.environmentReady ? "ready" : "incomplete"}
              />
            </li>
          </ul>
        </AdminPanel>

        <AdminPanel title="Environment checklist">
          <ul className="space-y-2 text-sm">
            {Object.entries(env).map(([key, ok]) => (
              <li key={key} className="flex items-center justify-between">
                <span className="font-mono text-xs">{key}</span>
                <AdminStatusPill
                  status={ok ? "ok" : "warn"}
                  label={ok ? "configured" : "missing"}
                />
              </li>
            ))}
          </ul>
        </AdminPanel>
      </div>
    </div>
  );
}
