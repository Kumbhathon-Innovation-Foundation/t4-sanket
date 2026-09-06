// Parking Detail Workspace
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getParkingLot, updateParkingOccupancy, setParkingStatus } from "@/services";
import { PageHeader, MapPanel, LoadingState, StatusBadge, TrendIndicator } from "@/components/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Ban, AlertTriangle, CheckCircle2, Car, Footprints, Clock, Sliders } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/admin/parking/$parkingId")({ component: ParkingDetail });

function ParkingDetail() {
  const { parkingId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [occInput, setOccInput] = useState("");
  const lot = useQuery({ queryKey: ["parking-lot", parkingId], queryFn: () => getParkingLot(parkingId) });

  const updateOcc = useMutation({
    mutationFn: (n: number) => updateParkingOccupancy(parkingId, n),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parking-lot", parkingId] });
      queryClient.invalidateQueries({ queryKey: ["parking"] });
      toast.success("Occupancy updated successfully");
      setOccInput("");
    },
  });

  const setStatus = useMutation({
    mutationFn: (s: "OPEN" | "FULL" | "CLOSED") => setParkingStatus(parkingId, s),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parking-lot", parkingId] });
      queryClient.invalidateQueries({ queryKey: ["parking"] });
      toast.success("Parking status updated");
    },
  });

  if (lot.isLoading) return <LoadingState />;
  const p = lot.data;
  if (!p) return <div className="py-16 text-center text-muted-foreground">Parking facility not found</div>;

  const pct = Math.round((p.occupied / p.capacity) * 100);
  const freeBays = Math.max(0, p.capacity - p.occupied);

  const badgeStatus =
    p.status === "CLOSED"
      ? "CLOSED"
      : p.occupied >= p.capacity
      ? "FULL"
      : pct >= 90
      ? "NEAR CAPACITY"
      : pct >= 70
      ? "BUSY"
      : "AVAILABLE";

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => navigate({ to: "/admin/parking" as any })}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title={`${p.name} (${p.id})`}
          subtitle={`Sector ${p.zoneId} · Destination: ${p.nearestGhat || "Ramkund Axis"} · ${p.walkingMinutes || 15} min pedestrian corridor`}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Total Capacity
          </span>
          <div className="mt-1 text-xl font-bold font-mono text-foreground">
            {p.capacity.toLocaleString()}
          </div>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Occupied Bays
          </span>
          <div className="mt-1 text-xl font-bold font-mono text-foreground">
            {p.occupied.toLocaleString()}
          </div>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Available Bays
          </span>
          <div className={`mt-1 text-xl font-bold font-mono ${freeBays <= 250 ? "text-rose-600" : "text-emerald-600"}`}>
            {freeBays.toLocaleString()}
          </div>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Occupancy Rate
          </span>
          <div className={`mt-1 text-xl font-bold font-mono ${pct >= 90 ? "text-rose-600" : pct >= 70 ? "text-amber-600" : "text-emerald-600"}`}>
            {pct}%
          </div>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Telemetry Trend
          </span>
          <div className="mt-1 flex items-center gap-1.5 text-sm font-bold text-amber-600">
            <TrendIndicator trend={p.trend} />
            <span>Active Ingress</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Geographic Facility View
            </span>
            <span className="text-xs text-muted-foreground">
              Sector {p.zoneId} Perimeter Coordinates
            </span>
          </div>
          <MapPanel
            markers={[
              {
                id: p.id,
                point: p.point,
                label: p.name,
                category: "parking",
                badge: badgeStatus,
                details: `${p.occupied.toLocaleString()} / ${p.capacity.toLocaleString()} occupied`,
              },
            ]}
            height="380px"
            initialLayers={{ parking: true, crowd: true, routes: true, places: true, gisNashik: true }}
          />
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground block">
              Adjust Bay Count
            </span>
            <div className="flex gap-2">
              <Input
                type="number"
                min={0}
                max={p.capacity}
                placeholder="New count"
                value={occInput}
                onChange={(e) => setOccInput(e.target.value)}
                className="h-8 text-xs font-mono"
              />
              <Button
                size="sm"
                className="h-8 text-xs font-semibold"
                disabled={!occInput || updateOcc.isPending}
                onClick={() => updateOcc.mutate(Number(occInput))}
              >
                {updateOcc.isPending ? "Updating..." : "Save"}
              </Button>
            </div>
            <div className="flex gap-1.5">
              {[50, 75, 90, 96].map((percent) => (
                <button
                  key={percent}
                  type="button"
                  onClick={() => setOccInput(String(Math.round((p.capacity * percent) / 100)))}
                  className="rounded border border-border/70 bg-muted/30 px-2 py-0.5 text-[11px] font-mono hover:bg-muted"
                >
                  {percent}%
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs space-y-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground block">
              Operator Overrides
            </span>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs border-rose-200 text-rose-600 hover:bg-rose-50"
                onClick={() => setStatus.mutate("FULL")}
                disabled={p.occupied >= p.capacity}
              >
                <AlertTriangle className="mr-2 h-3.5 w-3.5" /> Mark Full (100%)
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs text-stone-700 dark:text-stone-300"
                onClick={() => setStatus.mutate("CLOSED")}
                disabled={p.status === "CLOSED"}
              >
                <Ban className="mr-2 h-3.5 w-3.5" /> Close Facility Ingress
              </Button>
              {p.status !== "OPEN" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                  onClick={() => setStatus.mutate("OPEN")}
                >
                  <CheckCircle2 className="mr-2 h-3.5 w-3.5" /> Re-open Facility
                </Button>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground block">
              Pedestrian Journey Linkage
            </span>
            <div className="text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Primary Destination</span>
                <span className="font-semibold text-foreground">{p.nearestGhat}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Distance / Time</span>
                <span className="font-mono text-foreground">{p.walkingKm} km · {p.walkingMinutes} min walk</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Facility Status</span>
                <StatusBadge value={p.status} dot />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
