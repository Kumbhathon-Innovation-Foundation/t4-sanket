// Volunteer Detail Page
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getVolunteer, setVolunteerStatus, assignVolunteer } from "@/services";
import { PageHeader, MetricCard, MetricStrip, MapPanel, LoadingState } from "@/components/admin";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { ArrowLeft, UserCheck, Clock, UserX, Shield, Languages, Send } from "lucide-react";
import { toast } from "sonner";
import type { Volunteer } from "@/types";

export const Route = createFileRoute("/admin/volunteers/$volunteerId")({
  component: VolunteerDetailPage,
});

function VolunteerDetailPage() {
  const { volunteerId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [taskInput, setTaskInput] = useState("");

  const volQuery = useQuery({
    queryKey: ["volunteer", volunteerId],
    queryFn: () => getVolunteer(volunteerId),
  });

  const updateStatus = useMutation({
    mutationFn: (status: Volunteer["status"]) => setVolunteerStatus(volunteerId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["volunteer", volunteerId] });
      qc.invalidateQueries({ queryKey: ["volunteers"] });
      toast.success("Volunteer status updated");
    },
  });

  const assign = useMutation({
    mutationFn: (task: string) => assignVolunteer(volunteerId, task),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["volunteer", volunteerId] });
      qc.invalidateQueries({ queryKey: ["volunteers"] });
      setTaskInput("");
      toast.success("Assignment dispatched");
    },
  });

  if (volQuery.isLoading) return <LoadingState />;
  const volunteer = volQuery.data;
  if (!volunteer) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-lg font-semibold">Volunteer not found</h2>
        <Button variant="outline" className="mt-4" onClick={() => navigate({ to: "/admin/volunteers" })}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Volunteers
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={volunteer.name}
        subtitle={`ID: ${volunteer.id} · Assigned Zone: ${volunteer.zoneId}`}
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate({ to: "/admin/volunteers" })}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Roster
          </Button>
        }
      />

      <MetricStrip>
        <MetricCard
          label="Current Status"
          value={<StatusBadge value={volunteer.status} dot />}
          sublabel={volunteer.lastActiveMinutesAgo === 0 ? "Active right now" : `${volunteer.lastActiveMinutesAgo}m ago`}
        />
        <MetricCard label="Zone" value={volunteer.zoneId} sublabel="Stationed area" />
        <MetricCard label="Languages" value={volunteer.languages.length} sublabel={volunteer.languages.join(", ")} />
        <MetricCard label="Skills Verified" value={volunteer.skills.length} sublabel={volunteer.skills.join(", ")} />
      </MetricStrip>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Map Location */}
          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Current GPS Location</h3>
            <MapPanel
              markers={[
                {
                  id: volunteer.id,
                  point: volunteer.point,
                  label: volunteer.name,
                  color: volunteer.status === "AVAILABLE" ? "#22c55e" : volunteer.status === "ASSIGNED" ? "#3b82f6" : "#94a3b8",
                  size: "lg",
                },
              ]}
              height="300px"
            />
          </div>

          {/* Profile & Skillset Card */}
          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Capabilities & Accreditation</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="mb-1 text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Languages className="h-3.5 w-3.5" /> Linguistic Proficiency
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {volunteer.languages.map((l) => (
                    <Badge key={l} variant="secondary" className="text-xs">
                      {l}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-1 text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" /> Trained Skills
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {volunteer.skills.map((s) => (
                    <Badge key={s} variant="outline" className="bg-primary/5 text-primary text-xs">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dispatch & Actions */}
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Dispatch Mission</h3>
            <p className="mb-3 text-xs text-muted-foreground">
              Send a mission push alert to this volunteer's handheld mobile device.
            </p>
            <div className="space-y-2">
              <input
                type="text"
                className="w-full rounded border bg-background px-3 py-2 text-xs"
                placeholder="Mission description e.g. First-aid at Ghat Gate 3"
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
              />
              <Button
                className="w-full text-xs gap-2"
                size="sm"
                disabled={!taskInput.trim()}
                onClick={() => assign.mutate(taskInput)}
              >
                <Send className="h-3.5 w-3.5" /> Dispatch Task
              </Button>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Duty Status Override</h3>
            <div className="grid grid-cols-1 gap-2">
              <Button
                variant={volunteer.status === "AVAILABLE" ? "default" : "outline"}
                size="sm"
                className="justify-start gap-2 text-xs"
                onClick={() => updateStatus.mutate("AVAILABLE")}
              >
                <UserCheck className="h-4 w-4 text-emerald-500" /> Mark Available
              </Button>
              <Button
                variant={volunteer.status === "ASSIGNED" ? "default" : "outline"}
                size="sm"
                className="justify-start gap-2 text-xs"
                onClick={() => updateStatus.mutate("ASSIGNED")}
              >
                <Clock className="h-4 w-4 text-blue-500" /> Mark On Duty
              </Button>
              <Button
                variant={volunteer.status === "OFFLINE" ? "default" : "outline"}
                size="sm"
                className="justify-start gap-2 text-xs"
                onClick={() => updateStatus.mutate("OFFLINE")}
              >
                <UserX className="h-4 w-4 text-muted-foreground" /> Mark Standby / Offline
              </Button>
            </div>
          </div>

          {volunteer.assignment && (
            <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
              <div className="text-xs font-semibold text-blue-500 mb-1">Active Mission</div>
              <div className="text-xs text-foreground font-medium">{volunteer.assignment}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
