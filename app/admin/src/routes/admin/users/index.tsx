// Users & Roles Management
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUsers, updateUser } from "@/services";
import { PageHeader, MetricCard, MetricStrip, LoadingState } from "@/components/admin";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { FilterBar, SearchInput, SelectFilter } from "@/components/admin/FilterBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Users as UsersIcon, UserCheck, Shield, UserX, Plus, Mail } from "lucide-react";
import { toast } from "sonner";
import type { AppUser } from "@/types";
import { mutate } from "@/services/mock/store";

export const Route = createFileRoute("/admin/users/")({
  component: UsersPage,
});

function UsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [groupFilter, setGroupFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AppUser["role"]>("Crowd Operator");

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, currentStatus }: { id: string; currentStatus: AppUser["status"] }) => {
      const nextStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
      return updateUser(id, { status: nextStatus });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("User access status updated");
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const newUser: AppUser = {
        id: `USR-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
        name: inviteName,
        email: inviteEmail,
        role: inviteRole,
        group: "ADMIN",
        status: "ACTIVE",
        lastActive: "Just now",
        created: (new Date().toISOString().split("T")[0] as string) || "2026-09-06",
      };
      mutate((s) => ({
        ...s,
        users: [newUser, ...s.users],
      }));
      return newUser;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setShowInviteModal(false);
      setInviteName("");
      setInviteEmail("");
      toast.success("New user invited and activated");
    },
  });

  if (usersQuery.isLoading) return <LoadingState />;
  const all = usersQuery.data ?? [];

  const filtered = all.filter((u) => {
    if (
      search &&
      !u.name.toLowerCase().includes(search.toLowerCase()) &&
      !u.email.toLowerCase().includes(search.toLowerCase()) &&
      !u.role.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
    if (groupFilter !== "ALL" && u.group !== groupFilter) return false;
    if (statusFilter !== "ALL" && u.status !== statusFilter) return false;
    return true;
  });

  const activeCount = all.filter((u) => u.status === "ACTIVE").length;
  const adminCount = all.filter((u) => u.group === "ADMIN").length;
  const suspendedCount = all.filter((u) => u.status === "SUSPENDED").length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Users & Role-Based Access"
        subtitle="Manage operators, administrative credentials, role permissions, and access controls"
        actions={
          <Button
            size="sm"
            className="gap-2 bg-primary text-primary-foreground"
            onClick={() => setShowInviteModal(true)}
          >
            <Plus className="h-4 w-4" /> Add Operator / Staff
          </Button>
        }
      />

      <MetricStrip>
        <MetricCard label="Total Registered" value={all.length} icon={<UsersIcon className="h-4 w-4" />} />
        <MetricCard
          label="Active Users"
          value={activeCount}
          variant="success"
          icon={<UserCheck className="h-4 w-4" />}
          sublabel="Authenticated access"
        />
        <MetricCard
          label="Operations Staff"
          value={adminCount}
          variant="info"
          icon={<Shield className="h-4 w-4" />}
          sublabel="Control room accounts"
        />
        <MetricCard
          label="Suspended"
          value={suspendedCount}
          variant={suspendedCount > 0 ? "warning" : "default"}
          icon={<UserX className="h-4 w-4" />}
          sublabel="Revoked access"
        />
      </MetricStrip>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="rounded-lg border border-primary/30 bg-card p-5 shadow-lg">
          <h3 className="mb-1 text-sm font-semibold text-foreground">Invite Control Room Operator</h3>
          <p className="mb-4 text-xs text-muted-foreground">
            Issue credentials with role-specific permissions for the Kumbh operations dashboard.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              type="text"
              required
              placeholder="Full Name (e.g. Ramesh Kadam)"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              className="rounded border bg-background px-3 py-1.5 text-xs"
            />
            <input
              type="email"
              required
              placeholder="Official Email (e.g. ramesh@kumbh.gov.in)"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="rounded border bg-background px-3 py-1.5 text-xs"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as AppUser["role"])}
              className="rounded border bg-background px-3 py-1.5 text-xs"
            >
              <option value="Super Admin">Super Admin</option>
              <option value="Operations Head">Operations Head</option>
              <option value="Crowd Operator">Crowd Operator</option>
              <option value="Food Operator">Food Operator</option>
              <option value="Facilities Operator">Facilities Operator</option>
              <option value="Content Manager">Content Manager</option>
              <option value="Volunteer Coordinator">Volunteer Coordinator</option>
            </select>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowInviteModal(false)} className="text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              className="text-xs gap-1.5 bg-primary text-primary-foreground"
              disabled={!inviteName || !inviteEmail}
              onClick={() => inviteMutation.mutate()}
            >
              <Mail className="h-3.5 w-3.5" /> Send Invitation
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-lg border bg-card p-4">
        <FilterBar className="mb-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name, email, or role…"
            className="w-64"
          />
          <SelectFilter
            value={roleFilter}
            onChange={setRoleFilter}
            options={[
              { value: "ALL", label: "All Roles" },
              { value: "Super Admin", label: "Super Admin" },
              { value: "Operations Head", label: "Operations Head" },
              { value: "Crowd Operator", label: "Crowd Operator" },
              { value: "Food Operator", label: "Food Operator" },
              { value: "Facilities Operator", label: "Facilities Operator" },
              { value: "Content Manager", label: "Content Manager" },
              { value: "Volunteer Coordinator", label: "Volunteer Coordinator" },
              { value: "Pilgrim", label: "Pilgrim" },
              { value: "Volunteer", label: "Volunteer" },
              { value: "Kitchen Operator", label: "Kitchen Operator" },
              { value: "Donor", label: "Donor" },
            ]}
          />
          <SelectFilter
            value={groupFilter}
            onChange={setGroupFilter}
            options={[
              { value: "ALL", label: "All Groups" },
              { value: "ADMIN", label: "Admin & Operations" },
              { value: "VOLUNTEER", label: "Volunteers" },
              { value: "KITCHEN", label: "Kitchen Operators" },
              { value: "DONOR", label: "Donors" },
              { value: "PILGRIM", label: "Pilgrims" },
            ]}
          />
          <SelectFilter
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "ALL", label: "All Statuses" },
              { value: "ACTIVE", label: "Active" },
              { value: "SUSPENDED", label: "Suspended" },
              { value: "INVITED", label: "Invited" },
            ]}
          />
        </FilterBar>

        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 pr-4 font-medium text-muted-foreground">User</th>
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Assigned Role</th>
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Access Group</th>
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Status</th>
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Last Active</th>
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Created</th>
                <th className="pb-2 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                        {u.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{u.name}</div>
                        <div className="text-[11px] text-muted-foreground">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 pr-4">
                    <Badge variant="outline" className="text-[10px] font-medium bg-muted/30">
                      {u.role}
                    </Badge>
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className="text-[11px] font-medium text-muted-foreground">{u.group}</span>
                  </td>
                  <td className="py-2.5 pr-4">
                    <StatusBadge value={u.status} dot />
                  </td>
                  <td className="py-2.5 pr-4 text-muted-foreground">{u.lastActive}</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">{u.created}</td>
                  <td className="py-2.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-7 text-[11px] ${
                        u.status === "ACTIVE"
                          ? "text-red-600 hover:text-red-700 hover:bg-red-50"
                          : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                      }`}
                      onClick={() => toggleStatusMutation.mutate({ id: u.id, currentStatus: u.status })}
                    >
                      {u.status === "ACTIVE" ? "Suspend" : "Activate"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
