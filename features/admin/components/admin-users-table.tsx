"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminPanel } from "@/features/admin/components/admin-ui";
import {
  deleteUserAction,
  reactivateUserAction,
  setUserRoleAction,
  suspendUserAction,
} from "@/features/admin/actions/admin-user-actions";
import type { Profile } from "@/types/database";
import { isSuperAdmin } from "@/services/rbac/roles";

type AdminUsersTableProps = {
  users: Profile[];
  total: number;
  page: number;
  pageSize: number;
  actor: Profile;
  search: string;
  role: string;
  status: string;
};

export function AdminUsersTable({
  users,
  total,
  page,
  pageSize,
  actor,
  search,
  role,
  status,
}: AdminUsersTableProps) {
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(search);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const canManageRoles = isSuperAdmin(actor.role);

  const hrefFor = useMemo(() => {
    return (nextPage: number) => {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (role !== "all") params.set("role", role);
      if (status !== "all") params.set("status", status);
      params.set("page", String(nextPage));
      return `/admin/users?${params.toString()}`;
    };
  }, [query, role, status]);

  function run(
    action: () => Promise<{ success: boolean; error?: string; message?: string }>,
  ) {
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        toast.error(result.error ?? "Action failed");
        return;
      }
      toast.success(result.message ?? "Done");
      window.location.reload();
    });
  }

  return (
    <div className="space-y-4">
      <AdminPanel title="Filters">
        <form
          className="grid gap-3 md:grid-cols-[1fr_160px_160px_auto]"
          method="get"
          action="/admin/users"
        >
          <div className="space-y-2">
            <Label htmlFor="q">Search</Label>
            <Input
              id="q"
              name="q"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Email or name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              name="role"
              defaultValue={role}
              className="flex h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
            >
              <option value="all">All roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
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
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
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
        title={`Users (${total})`}
        description="Platform accounts — suspend, reactivate, promote, or inspect."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="px-2 py-2 font-medium">User</th>
                <th className="px-2 py-2 font-medium">Role</th>
                <th className="px-2 py-2 font-medium">Status</th>
                <th className="px-2 py-2 font-medium">Joined</th>
                <th className="px-2 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const locked = isSuperAdmin(user.role);
                return (
                  <tr
                    key={user.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-2 py-3">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="font-medium admin-link"
                      >
                        {user.full_name || "Unnamed"}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </td>
                    <td className="px-2 py-3">
                      <Badge variant="secondary" className="capitalize">
                        {user.role.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-2 py-3 capitalize">{user.status}</td>
                    <td className="px-2 py-3 text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/users/${user.id}`}>View</Link>
                        </Button>
                        {user.status === "active" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={pending || locked || user.id === actor.id}
                            onClick={() =>
                              run(() => suspendUserAction(user.id))
                            }
                          >
                            Suspend
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={pending || locked || user.id === actor.id}
                            onClick={() =>
                              run(() => reactivateUserAction(user.id))
                            }
                          >
                            Activate
                          </Button>
                        )}
                        {canManageRoles && user.role === "user" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={pending}
                            onClick={() =>
                              run(() => setUserRoleAction(user.id, "admin"))
                            }
                          >
                            Promote
                          </Button>
                        ) : null}
                        {canManageRoles && user.role === "admin" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={pending}
                            onClick={() =>
                              run(() => setUserRoleAction(user.id, "user"))
                            }
                          >
                            Demote
                          </Button>
                        ) : null}
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-700 hover:bg-red-50"
                          disabled={pending || locked || user.id === actor.id}
                          onClick={() => {
                            if (
                              !window.confirm(
                                `Delete ${user.email}? This cannot be undone.`,
                              )
                            ) {
                              return;
                            }
                            run(() => deleteUserAction(user.id));
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-2 py-8 text-center text-muted-foreground"
                  >
                    No users match these filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 text-sm">
          <p className="text-muted-foreground">
            Page {page} of {pages}
          </p>
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline" disabled={page <= 1}>
              <Link href={hrefFor(page - 1)} aria-disabled={page <= 1}>
                Previous
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant="outline"
              disabled={page >= pages}
            >
              <Link href={hrefFor(page + 1)} aria-disabled={page >= pages}>
                Next
              </Link>
            </Button>
          </div>
        </div>
      </AdminPanel>
    </div>
  );
}
