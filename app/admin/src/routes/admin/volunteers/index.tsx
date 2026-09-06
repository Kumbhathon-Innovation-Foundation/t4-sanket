// Volunteers Management
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getVolunteers, setVolunteerStatus, assignVolunteer } from "@/services";
import {
  PageHeader,
  MetricCard,
  MetricStrip,
  MapPanel,
  MapLegend,
  LoadingState,
} from "@/components/admin";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { FilterBar, SearchInput, SelectFilter } from "@/components/admin/FilterBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Users, UserCheck, Clock, ArrowRight, CheckCircle2, UserX } from "lucide-react";
import { toast } from "sonner";
import type { Volunteer } from "@/types";

export const Route = createFileRoute("/admin/volunteers/")({
  component: VolunteersPage,
});

function VolunteersPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [zoneFilter, setZoneFilter] = useState("ALL");
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [assignmentInput, setAssignmentInput] = useState("");

  const volunteersQuery = useQuery({
    queryKey: ["volunteers"],
    queryFn: getVolunteers,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Volunteer["status"] }) =>
      setVolunteerStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["volunteers"] });
      toast.success("Volunteer status updated");
    },
  });

  const assign = useMutation({
    mutationFn: ({ id, task }: { id: string; task: string }) =>
      assignVolunteer(id, task),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["volunteers"] });
      setAssigningId(null);
      setAssignmentInput("");
      toast.success("Volunteer assigned successfully");
    },
  });

  if (volunteersQuery.isLoading) return <LoadingState />;
  const all = volunteersQuery.data ?? [];

  const filtered = all.filter((v) => {
    if (search && !v.name.toLowerCase().includes(search.toLowerCase()) && !v.id.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (statusFilter !== "ALL" && v.status !== statusFilter) return false;
    if (zoneFilter !== "ALL" && v.zoneId !== zoneFilter) return false;
    return true;
  });

  const availableCount = all.filter((v) => v.status === "AVAILABLE").length;
  const assignedCount = all.filter((v) => v.status === "ASSIGNED").length;
  const offlineCount = all.filter((v) => v.status === "OFFLINE").length;

  const uniqueZones = Array.from(new Set(all.map((v) => v.zoneId))).sort();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Volunteer Deployment"
        subtitle="Real-time volunteer locations, skill allocation, and field dispatch"
      />

      <MetricStrip>
        <MetricCard label="Total Force" value={all.length} icon={<Users className="h-4 w-4" />} />
        <MetricCard
          label="Available"
          value={availableCount}
          variant="success"
          icon={<UserCheck className="h-4 w-4" />}
          sublabel="Ready for dispatch"
        />
        <MetricCard
          label="Assigned"
          value={assignedCount}
          variant="info"
          icon={<Clock className="h-4 w-4" />}
          sublabel="Currently on duty"
        />
        <MetricCard
          label="Offline"
          value={offlineCount}
          variant="default"
          icon={<UserX className="h-4 w-4" />}
          sublabel="Off-shift"
        />
      </MetricStrip>

      {/* Volunteer Locations Map */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Volunteer Field Distribution</h3>
        <MapPanel
          markers={all.map((v) => ({
            id: v.id,
            point: v.point,
            label: v.name.split(" ")[0],
            color: v.status === "AVAILABLE" ? "#22c55e" : v.status === "ASSIGNED" ? "#3b82f6" : "#94a3b8",
            size: "sm",
          }))}
          onMarkerClick={(id) => navigate({ to: `/admin/volunteers/${id}` })}
          height="320px"
          legend={
            <MapLegend
              items={[
                { color: "#22c55e", label: "Available" },
                { color: "#3b82f6", label: "Assigned / On Duty" },
                { color: "#94a3b8", label: "Offline" },
              ]}
            />
          }
        />
      </div>

      {/* Roster & Filtering */}
      <div className="rounded-lg border bg-card p-4">
        <FilterBar className="mb-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search name, ID…"
            className="w-56"
          />
          <SelectFilter
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "ALL", label: "All Statuses" },
              { value: "AVAILABLE", label: "Available" },
              { value: "ASSIGNED", label: "Assigned" },
              { value: "OFFLINE", label: "Offline" },
            ]}
          />
          <SelectFilter
            value={zoneFilter}
            onChange={setZoneFilter}
            options={[
              { value: "ALL", label: "All Zones" },
              ...uniqueZones.map((z) => ({ value: z, label: z })),
            ]}
          />
        </FilterBar>

        {/* Inline Assignment Modal/Banner if active */}
        {assigningId && (
          <div className="mb-4 flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs">
            <span className="font-semibold text-foreground">
              Assign task to {all.find((v) => v.id === assigningId)?.name}:
            </span>
            <input
              type="text"
              className="flex-1 rounded border bg-background px-2.5 py-1 text-xs"
              placeholder="e.g. Crowd assistance at Ram Kund Gate 2"
              value={assignmentInput}
              onChange={(e) => setAssignmentInput(e.target.value)}
            />
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={() => assign.mutate({ id: assigningId, task: assignmentInput || "General Crowd Control" })}
            >
              Confirm Dispatch
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setAssigningId(null);
                setAssignmentInput("");
              }}
            >
              Cancel
            </Button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Volunteer</th>
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Zone</th>
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Languages</th>
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Skills</th>
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Status</th>
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Current Assignment</th>
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Last Seen</th>
                <th className="pb-2 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-2.5 pr-4">
                    <div className="font-medium">{v.name}</div>
                    <div className="text-[11px] text-muted-foreground">{v.id}</div>
                  </td>
                  <td className="py-2.5 pr-4">
                    <Badge variant="outline" className="text-[10px] font-normal">
                      {v.zoneId}
                    </Badge>
                  </td>
                  <td className="py-2.5 pr-4">
                    <div className="flex flex-wrap gap-1">
                      {v.languages.map((l) => (
                        <span key={l} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          {l}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-2.5 pr-4">
                    <div className="flex flex-wrap gap-1">
                      {v.skills.map((s) => (
                        <span key={s} className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-2.5 pr-4">
                    <StatusBadge value={v.status} dot />
                  </td>
                  <td className="py-2.5 pr-4 max-w-[180px] truncate text-muted-foreground">
                    {v.assignment || "—"}
                  </td>
                  <td className="py-2.5 pr-4 text-muted-foreground">
                    {v.lastActiveMinutesAgo === 0 ? "Just now" : `${v.lastActiveMinutesAgo}m ago`}
                  </td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[11px]"
                        onClick={() => navigate({ to: `/admin/volunteers/${v.id}` })}
                        title="View Profile"
                      >
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                      {v.status === "AVAILABLE" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px]"
                          onClick={() => {
                            setAssigningId(v.id);
                            setAssignmentInput("");
                          }}
                        >
                          Dispatch
                        </Button>
                      )}
                      {v.status === "ASSIGNED" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[11px] text-emerald-600 hover:text-emerald-700"
                          onClick={() => updateStatus.mutate({ id: v.id, status: "AVAILABLE" })}
                          title="Mark Available / Completed"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
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
