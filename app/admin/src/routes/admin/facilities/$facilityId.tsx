// Facility Detail Workspace
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFacility, setFacilityStatus, updateFacilityQueue } from "@/services";
import {
  PageHeader,
  MapPanel,
  LoadingState,
  StatusBadge,
  UpdateFacilityModal,
  ReportIssueModal,
  getFacilityTypeIcon,
} from "@/components/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Ban, CheckCircle, AlertTriangle, Clock, Sliders, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/admin/facilities/$facilityId")({ component: FacilityDetail });

function FacilityDetail() {
  const { facilityId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const facility = useQuery({
    queryKey: ["facility", facilityId],
    queryFn: () => getFacility(facilityId),
  });

  const setStatus = useMutation({
    mutationFn: (s: "OPEN" | "NEEDS_ATTENTION" | "CLOSED") => setFacilityStatus(facilityId, s),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["facility", facilityId] });
      qc.invalidateQueries({ queryKey: ["facilities"] });
      toast.success("Facility status updated");
    },
  });

  if (facility.isLoading) return <LoadingState />;
  const f = facility.data;
  if (!f) return <div className="py-16 text-center text-muted-foreground">Facility not found</div>;

  const isClosed = f.status === "CLOSED";
  const isLongQueue = !isClosed && (f.queue === "HIGH" || f.waitMinutes >= 8);
  const isBusy = !isClosed && !isLongQueue && (f.queue === "MODERATE" || f.waitMinutes >= 4);

  const operationalState: "OPEN" | "BUSY" | "LONG QUEUE" | "OUT OF SERVICE" | "UNKNOWN" = isClosed
    ? "OUT OF SERVICE"
    : isLongQueue
    ? "LONG QUEUE"
    : isBusy
    ? "BUSY"
    : f.status === "NEEDS_ATTENTION"
    ? "UNKNOWN"
    : "OPEN";

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => navigate({ to: "/admin/facilities" as any })}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title={`${f.name} (${f.id})`}
          subtitle={`${f.type} · Sector ${f.zoneId} · Last inspection: ${f.lastInspection}`}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Operational State
          </span>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`rounded px-2 py-0.5 text-xs font-bold uppercase ${
                operationalState === "LONG QUEUE"
                  ? "bg-rose-100 text-rose-700"
                  : operationalState === "BUSY"
                  ? "bg-amber-100 text-amber-700"
                  : operationalState === "OUT OF SERVICE"
                  ? "bg-stone-200 text-stone-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {operationalState}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Queue Pressure
          </span>
          <div className="mt-1 text-lg font-bold font-mono text-foreground uppercase">
            {f.queue}
          </div>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Estimated Wait
          </span>
          <div
            className={`mt-1 text-lg font-bold font-mono ${
              f.waitMinutes >= 8 ? "text-rose-600" : "text-emerald-600"
            }`}
          >
            ~{f.waitMinutes} mins
          </div>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Capacity Units
          </span>
          <div className="mt-1 text-lg font-bold font-mono text-foreground">
            {f.capacity}
          </div>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Accessibility
          </span>
          <div className="mt-1 flex items-center gap-1 text-xs font-bold text-foreground">
            {f.accessible ? (
              <span className="text-emerald-600 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" /> Wheelchair Ramps
              </span>
            ) : (
              <span className="text-muted-foreground">Standard</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Geographic Facility Coordinates
            </span>
            <span className="text-xs text-muted-foreground">
              Sector {f.zoneId} Perimeter
            </span>
          </div>

          <MapPanel
            markers={[
              {
                id: f.id,
                point: f.point,
                label: f.name,
                category: "facility",
                badge: operationalState,
                details: `${f.type} · ${f.queue} Queue (~${f.waitMinutes}m wait)`,
              },
            ]}
            height="380px"
            initialLayers={{ facilities: true, crowd: true, routes: true, gisNashik: true }}
          />
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground block">
              Operator Overrides
            </span>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs bg-card"
                onClick={() => setIsUpdateOpen(true)}
              >
                <Sliders className="mr-2 h-3.5 w-3.5 text-primary" /> Update Queue / Wait
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
                onClick={() => setIsReportOpen(true)}
              >
                <AlertTriangle className="mr-2 h-3.5 w-3.5 text-amber-500" /> Report Maintenance Issue
              </Button>

              {f.status === "CLOSED" ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  onClick={() => setStatus.mutate("OPEN")}
                >
                  <CheckCircle className="mr-2 h-3.5 w-3.5 text-emerald-500" /> Re-open Facility
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs text-stone-700 dark:text-stone-300"
                  onClick={() => setStatus.mutate("CLOSED")}
                >
                  <Ban className="mr-2 h-3.5 w-3.5 text-stone-500" /> Close Facility
                </Button>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs space-y-2 text-xs">
            <span className="font-semibold uppercase tracking-wider text-foreground block border-b border-border/60 pb-2">
              Service Health & Inspection
            </span>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Inspected:</span>
              <span className="font-medium text-foreground">{f.lastInspection}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Telemetry Age:</span>
              <span className="font-mono text-foreground">
                {f.updatedMinutesAgo ? `${f.updatedMinutesAgo}m ago` : "Live telemetry"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Host Sector:</span>
              <span className="font-semibold text-foreground">Zone {f.zoneId}</span>
            </div>
          </div>
        </div>
      </div>

      <UpdateFacilityModal
        facility={f}
        isOpen={isUpdateOpen}
        onClose={() => setIsUpdateOpen(false)}
      />

      <ReportIssueModal
        facility={f}
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />
    </div>
  );
}
