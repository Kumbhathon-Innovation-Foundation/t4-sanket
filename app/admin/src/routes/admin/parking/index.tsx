// Parking Operations Control Room
// Real-time operations workspace for parking capacity, pedestrian corridors, and traffic diversion
import React, { useState, useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getParking,
  getCrowdZones,
  getRoutes,
  getSeries,
  updateParkingOccupancy,
  setParkingStatus,
  simulateParkingSurge,
} from "@/services";
import {
  PageHeader,
  MetricCard,
  MetricStrip,
  MapPanel,
  MapLegend,
  LoadingState,
  ParkingIntelligenceDrawer,
  UpdateOccupancyModal,
  ParkingComparisonCard,
} from "@/components/admin";
import { FilterBar, SearchInput } from "@/components/admin/FilterBar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Car,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Radio,
  Clock,
  CheckCircle2,
  Zap,
  RotateCcw,
  Sliders,
  ShieldAlert,
  Footprints,
  Navigation,
  GitCompare,
  SlidersHorizontal,
} from "lucide-react";
import type { ParkingLot } from "@/types";

export const Route = createFileRoute("/admin/parking/")({ component: ParkingPage });

// Walking corridor and destination ghat metadata
const LOT_CORRIDOR_MAP: Record<
  string,
  { corridorId: string; corridorName: string; destination: string; walkMins: number; status: "CLEAR" | "BUSY" | "CONGESTED" }
> = {
  P12: { corridorId: "R17", corridorName: "R17 Godavari South Link", destination: "Snan Ghat South", walkMins: 13, status: "CONGESTED" },
  P09: { corridorId: "R14", corridorName: "R14 Gadge Maharaj Bridge", destination: "Panchavati / Ramkund", walkMins: 18, status: "CLEAR" },
  P04: { corridorId: "R08", corridorName: "R08 Malegaon Stand Corridor", destination: "Ramkund West", walkMins: 15, status: "CLEAR" },
  P01: { corridorId: "R01", corridorName: "R01 Trimbak Highway Connector", destination: "Trimbak Axis", walkMins: 24, status: "CLEAR" },
  P03: { corridorId: "R06", corridorName: "R06 Tapovan Approach Road", destination: "Tapovan East", walkMins: 14, status: "BUSY" },
  P06: { corridorId: "R11", corridorName: "R11 Sadhugram Internal Ring", destination: "Sadhugram Concourse", walkMins: 10, status: "BUSY" },
};

function ParkingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Queries
  const parkingQuery = useQuery({ queryKey: ["parking"], queryFn: getParking });
  const zonesQuery = useQuery({ queryKey: ["crowd-zones"], queryFn: getCrowdZones });
  const routesQuery = useQuery({ queryKey: ["routes"], queryFn: getRoutes });
  const seriesQuery = useQuery({ queryKey: ["series"], queryFn: getSeries });

  // UI State
  const [search, setSearch] = useState("");
  const [selectedZoneFilter, setSelectedZoneFilter] = useState("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");

  // Selected Lot Drawer
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Update Occupancy Modal
  const [lotToUpdate, setLotToUpdate] = useState<ParkingLot | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // Comparison Lot IDs (default P12 and P09)
  const [comparisonLotIds, setComparisonLotIds] = useState<string[]>(["P12", "P09"]);

  // Demo Surge State tracking
  const [isSurging, setIsSurging] = useState(false);

  if (parkingQuery.isLoading || zonesQuery.isLoading) {
    return <LoadingState />;
  }

  const allLots = parkingQuery.data ?? [];
  const zones = zonesQuery.data ?? [];
  const routes = routesQuery.data ?? [];

  // Currently inspected lot object
  const inspectedLot = allLots.find((p) => p.id === selectedLotId) || null;
  const inspectedZone = inspectedLot ? zones.find((z) => z.id === inspectedLot.zoneId) || null : null;

  // P12 Telemetry Reference for Demo Surge Button
  const p12Lot = allLots.find((l) => l.id === "P12");
  const isP12Surged = p12Lot ? p12Lot.occupied >= 4500 : false;

  // Calculate Overall Basin Metrics
  const totalCap = allLots.reduce((acc, p) => acc + p.capacity, 0);
  const totalOcc = allLots.reduce((acc, p) => acc + p.occupied, 0);
  const availableBays = Math.max(0, totalCap - totalOcc);
  const basinOccupancyPct = totalCap > 0 ? Math.round((totalOcc / totalCap) * 100) : 0;
  const nearCapacityLots = allLots.filter((p) => p.status !== "CLOSED" && (p.occupied / p.capacity) >= 0.9);

  // Filtered Table Lots
  const filteredLots = allLots.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase());
    const matchesZone = selectedZoneFilter === "ALL" || p.zoneId === selectedZoneFilter;
    const occPct = Math.round((p.occupied / p.capacity) * 100);
    const matchesStatus =
      selectedStatusFilter === "ALL" ||
      (selectedStatusFilter === "FULL" && p.occupied >= p.capacity) ||
      (selectedStatusFilter === "NEAR_CAPACITY" && occPct >= 90 && p.occupied < p.capacity) ||
      (selectedStatusFilter === "BUSY" && occPct >= 70 && occPct < 90) ||
      (selectedStatusFilter === "AVAILABLE" && occPct < 70 && p.status !== "CLOSED") ||
      (selectedStatusFilter === "CLOSED" && p.status === "CLOSED");

    return matchesSearch && matchesZone && matchesStatus;
  });

  // Map Markers with 5 Operational States
  const mapMarkers = allLots.map((p) => {
    const occPct = Math.round((p.occupied / p.capacity) * 100);
    const isClosed = p.status === "CLOSED";
    const isFull = !isClosed && p.occupied >= p.capacity;
    const isNearCap = !isClosed && !isFull && occPct >= 90;
    const isBusy = !isClosed && !isFull && !isNearCap && occPct >= 70;

    const badge: "FULL" | "NEAR CAPACITY" | "BUSY" | "AVAILABLE" | "CLOSED" = isClosed
      ? "CLOSED"
      : isFull
      ? "FULL"
      : isNearCap
      ? "NEAR CAPACITY"
      : isBusy
      ? "BUSY"
      : "AVAILABLE";

    const badgeBg =
      badge === "FULL"
        ? "#ef4444"
        : badge === "NEAR CAPACITY"
        ? "#f97316"
        : badge === "BUSY"
        ? "#3b82f6"
        : badge === "CLOSED"
        ? "#64748b"
        : "#10b981";

    const freeSpaces = Math.max(0, p.capacity - p.occupied);

    return {
      id: p.id,
      point: p.point,
      label: p.name,
      category: "parking" as const,
      badge,
      badgeBg,
      details: `${p.occupied.toLocaleString()} / ${p.capacity.toLocaleString()} (${occPct}%) · ${freeSpaces.toLocaleString()} bays free`,
    };
  });

  // Toggle Demo Surge
  const handleToggleSurge = async () => {
    setIsSurging(true);
    try {
      const nextSurgeState = !isP12Surged;
      await simulateParkingSurge("P12", nextSurgeState);
      await queryClient.invalidateQueries({ queryKey: ["parking"] });
      await queryClient.invalidateQueries({ queryKey: ["parking", "P12"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });

      if (nextSurgeState) {
        toast.warning("Simulated Surge Triggered: P12 occupancy set to 4,800 / 5,000 (96%)!", {
          description: "R17 corridor transit load escalated to CONGESTED. Dynamic recommendation generated.",
        });
      } else {
        toast.info("Surge Reset: P12 occupancy restored to 3,600 / 5,000 (72%).", {
          description: "Perimeter traffic load returned to normal operational threshold.",
        });
      }
    } catch (err) {
      toast.error("Failed to toggle parking surge simulation.");
    } finally {
      setIsSurging(false);
    }
  };

  // Drawer Opening Handler
  const handleOpenDrawer = (lotId: string) => {
    setSelectedLotId(lotId);
    setIsDrawerOpen(true);
  };

  // Lot Actions
  const handleMarkFull = async (lot: ParkingLot) => {
    try {
      await updateParkingOccupancy(lot.id, lot.capacity);
      await queryClient.invalidateQueries({ queryKey: ["parking"] });
      toast.warning(`${lot.id} (${lot.name}) marked as FULL.`);
    } catch (err) {
      toast.error("Failed to mark parking full.");
    }
  };

  const handleCloseLot = async (lot: ParkingLot) => {
    try {
      await setParkingStatus(lot.id, "CLOSED");
      await queryClient.invalidateQueries({ queryKey: ["parking"] });
      toast.error(`${lot.id} (${lot.name}) closed for incoming vehicles.`);
    } catch (err) {
      toast.error("Failed to close parking lot.");
    }
  };

  const handleReopenLot = async (lot: ParkingLot) => {
    try {
      await setParkingStatus(lot.id, "OPEN");
      await queryClient.invalidateQueries({ queryKey: ["parking"] });
      toast.success(`${lot.id} (${lot.name}) re-opened for parking.`);
    } catch (err) {
      toast.error("Failed to re-open parking lot.");
    }
  };

  // Trigger Route Advisory / Diversion
  const handleRedirectTraffic = (fromLotId: string, toLotId: string) => {
    const from = allLots.find((l) => l.id === fromLotId);
    const to = allLots.find((l) => l.id === toLotId);
    const corridor = LOT_CORRIDOR_MAP[toLotId]?.corridorName || "connecting corridor";

    toast.success(`TRAFFIC DIVERSION ACTIVATED: Diverting inbound vehicles from ${fromLotId} to ${toLotId}`, {
      description: `Pilgrims advised via VMS and Public Alert to route via ${corridor}.`,
      action: {
        label: "Create Broadcast",
        onClick: () =>
          navigate({
            to: "/alerts/create" as any,
            search: { zoneId: from?.zoneId || "Z07" } as any,
          }),
      },
    });
  };

  // Toggle comparison lot chip
  const handleToggleComparisonLot = (lotId: string) => {
    setComparisonLotIds((prev) => {
      if (prev.includes(lotId)) {
        if (prev.length <= 1) return prev; // keep at least 1
        return prev.filter((id) => id !== lotId);
      }
      if (prev.length >= 3) {
        // replace last
        return [prev[0] as string, prev[1] as string, lotId];
      }
      return [...prev, lotId];
    });
  };

  // Computed Operational Advisory
  const highPressureLot = allLots.find(
    (l) => l.status !== "CLOSED" && (l.occupied / l.capacity) >= 0.9
  );
  const bestAltLot = allLots.find(
    (l) => l.id === "P09" || (l.status !== "CLOSED" && (l.occupied / l.capacity) < 0.6)
  );

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <PageHeader
          title="Parking Operations Control"
          subtitle="Monitor real-time parking basin saturation, pedestrian walking corridors, and live traffic diversion."
        />

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Demo Surge Switcher */}
          <Button
            type="button"
            size="sm"
            onClick={handleToggleSurge}
            disabled={isSurging}
            className={`text-xs font-semibold h-8 gap-1.5 shadow-sm transition-all ${
              isP12Surged
                ? "bg-amber-600 hover:bg-amber-700 text-white border-amber-500 animate-pulse"
                : "bg-stone-900 hover:bg-stone-800 text-amber-300 border border-amber-500/40"
            }`}
          >
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            {isP12Surged ? "Reset Surge: P12 at 72%" : "Simulate Surge: P12 at 96%"}
          </Button>

          {/* Telemetry Badge */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-border/80 bg-card/80 px-2.5 py-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
            <span className="font-medium text-foreground">LIVE</span>
            <span>· Updated 21s ago</span>
          </div>

          <Button
            size="sm"
            variant="outline"
            className="text-xs h-8 gap-1.5"
            onClick={() => {
              const p12 = allLots.find((l) => l.id === "P12");
              if (p12) {
                setLotToUpdate(p12);
                setIsUpdateModalOpen(true);
              }
            }}
          >
            <Sliders className="h-3.5 w-3.5 text-primary" />
            Quick Update P12
          </Button>
        </div>
      </div>

      {/* Top Operational KPI Strip */}
      <MetricStrip>
        <MetricCard
          label="Total Basin Capacity"
          value={totalCap}
          icon={<Car className="h-4 w-4" />}
          variant="default"
        />
        <MetricCard
          label="Vehicles Occupied"
          value={totalOcc}
          variant="default"
        />
        <MetricCard
          label="Available Bays"
          value={availableBays}
          variant={availableBays < 3000 ? "warning" : "default"}
        />
        <MetricCard
          label="Basin Occupancy Rate"
          value={`${basinOccupancyPct}%`}
          variant={basinOccupancyPct >= 85 ? "critical" : basinOccupancyPct >= 70 ? "warning" : "default"}
        />
        <MetricCard
          label="Near Capacity Lots"
          value={nearCapacityLots.length}
          variant={nearCapacityLots.length > 0 ? "critical" : "default"}
        />
      </MetricStrip>

      {/* Dynamic Operational Insight Advisory Banner */}
      {highPressureLot ? (
        <div className="rounded-xl border border-rose-300 bg-rose-50/80 dark:bg-rose-950/40 dark:border-rose-800/70 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 mt-0.5">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-900 dark:text-rose-200">
                  Critical Ingress Warning · Sector {highPressureLot.zoneId}
                </span>
                <span className="rounded bg-rose-200/60 dark:bg-rose-900/60 px-1.5 py-0.2 text-[10px] font-bold text-rose-800 dark:text-rose-200 font-mono">
                  {highPressureLot.id} AT {Math.round((highPressureLot.occupied / highPressureLot.capacity) * 100)}%
                </span>
              </div>
              <p className="text-xs text-rose-950 dark:text-rose-100 leading-relaxed font-medium">
                <strong>{highPressureLot.name} ({highPressureLot.id})</strong> is nearing capacity with only{" "}
                <strong>{Math.max(0, highPressureLot.capacity - highPressureLot.occupied).toLocaleString()} free bays</strong>.
                Pedestrian corridor via <strong>{LOT_CORRIDOR_MAP[highPressureLot.id]?.corridorName || "South Link"}</strong> is experiencing severe congestion.
                {bestAltLot && (
                  <span>
                    {" "}Recommend directing incoming traffic to <strong>{bestAltLot.name} ({bestAltLot.id})</strong> which has{" "}
                    <strong>{Math.max(0, bestAltLot.capacity - bestAltLot.occupied).toLocaleString()} available spaces</strong> and a clear walking corridor.
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            {bestAltLot && (
              <Button
                type="button"
                size="sm"
                onClick={() => handleRedirectTraffic(highPressureLot.id, bestAltLot.id)}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs h-8 gap-1.5 shadow-xs"
              >
                <Radio className="h-3.5 w-3.5" />
                Redirect to {bestAltLot.id}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleOpenDrawer(highPressureLot.id)}
              className="text-xs h-8 bg-card"
            >
              Inspect {highPressureLot.id}
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/20 dark:border-emerald-800/40 p-3 shadow-xs flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="font-semibold">Perimeter Ingress Stable:</span>
            <span>All parking facilities are operating within nominal capacity thresholds. Walking corridors to Ramkund and Tapovan are flowing freely.</span>
          </div>
          <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
            {availableBays.toLocaleString()} Bays Available
          </span>
        </div>
      )}

      {/* Primary Operations Workspace (68% Map + 32% Priority & Corridors Panel) */}
      <div className="grid gap-4 lg:grid-cols-12 items-start">
        {/* Left Map Workspace (68% -> 8 cols) */}
        <div className="lg:col-span-8 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Perimeter Parking & Corridor Map
              </span>
              <span className="rounded bg-primary/10 px-1.5 py-0.2 text-[10px] font-bold text-primary font-mono">
                {allLots.length} Facilities Monitored
              </span>
            </div>

            <span className="text-[11px] text-muted-foreground hidden sm:inline">
              Click any parking marker to open the Live Intelligence Drawer
            </span>
          </div>

          <MapPanel
            zones={zones}
            markers={mapMarkers}
            routes={routes.map((r) => ({
              path: r.path,
              color: r.status === "CONGESTED" ? "#ef4444" : (r.status as string) === "BUSY" ? "#f97316" : "#3b82f6",
              dashed: r.status === "CONGESTED",
              name: r.name,
              status: r.status,
            }))}
            selectedId={selectedLotId || undefined}
            onMarkerClick={handleOpenDrawer}
            height="560px"
            initialLayers={{
              parking: true,
              crowd: true,
              routes: true,
              places: true,
              food: false,
              facilities: false,
              gisNashik: true,
            }}
            legend={
              <MapLegend
                items={[
                  { color: "#10b981", label: "Available (<70%)" },
                  { color: "#3b82f6", label: "Busy (70-89%)" },
                  { color: "#f97316", label: "Near Cap (90-99%)" },
                  { color: "#ef4444", label: "Full (100%)" },
                  { color: "#64748b", label: "Closed" },
                ]}
              />
            }
          />
        </div>

        {/* Right Operations Panel (32% -> 4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Priority Near Capacity Panel */}
          <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-orange-500" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Ingress Pressure Ranking
                </h3>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">
                Ranked by Fill Rate
              </span>
            </div>

            <div className="space-y-2">
              {[...allLots]
                .sort((a, b) => b.occupied / b.capacity - a.occupied / a.capacity)
                .slice(0, 5)
                .map((lot) => {
                  const occPct = Math.round((lot.occupied / lot.capacity) * 100);
                  const isNearCap = occPct >= 90;
                  const isSelected = selectedLotId === lot.id;

                  return (
                    <div
                      key={lot.id}
                      onClick={() => handleOpenDrawer(lot.id)}
                      className={`group cursor-pointer rounded-lg border p-2.5 transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/40"
                          : isNearCap
                          ? "border-rose-200 bg-rose-50/40 dark:bg-rose-950/20 hover:border-rose-300"
                          : "border-border/60 bg-muted/20 hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-foreground">
                            {lot.id}
                          </span>
                          <span className="text-xs font-medium text-foreground truncate max-w-[130px]">
                            {lot.name}
                          </span>
                        </div>
                        <span
                          className={`rounded px-1.5 py-0.2 text-[10px] font-bold uppercase ${
                            lot.status === "CLOSED"
                              ? "bg-stone-200 text-stone-700"
                              : occPct >= 90
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                              : occPct >= 70
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {lot.status === "CLOSED" ? "CLOSED" : `${occPct}%`}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>
                          {lot.occupied.toLocaleString()} / {lot.capacity.toLocaleString()} bays
                        </span>
                        <span
                          className={
                            lot.capacity - lot.occupied <= 250
                              ? "font-bold text-rose-600"
                              : "text-muted-foreground"
                          }
                        >
                          {Math.max(0, lot.capacity - lot.occupied).toLocaleString()} free
                        </span>
                      </div>

                      {/* Micro progress bar */}
                      <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full ${
                            occPct >= 90
                              ? "bg-rose-500"
                              : occPct >= 70
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.min(100, occPct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Key Pedestrian Corridor Transit Status */}
          <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <div className="flex items-center gap-2">
                <Footprints className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Corridor Transit Status
                </h3>
              </div>
              <span className="text-[10px] text-muted-foreground">Walking Ingress</span>
            </div>

            <div className="space-y-2 text-xs">
              {Object.entries(LOT_CORRIDOR_MAP).slice(0, 4).map(([lotId, meta]) => (
                <div
                  key={lotId}
                  className="flex items-center justify-between p-2 rounded-md bg-muted/20 border border-border/40"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-[11px] text-foreground">
                        {lotId}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        → {meta.destination}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground block">
                      {meta.corridorName} ({meta.walkMins} mins walk)
                    </span>
                  </div>

                  <span
                    className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                      meta.status === "CONGESTED"
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                        : meta.status === "BUSY"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {meta.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Lot Parking Comparison Matrix */}
      <ParkingComparisonCard
        allLots={allLots}
        zones={zones}
        selectedLotIds={comparisonLotIds}
        onToggleLot={handleToggleComparisonLot}
        onRedirectTraffic={handleRedirectTraffic}
        onInspectLot={handleOpenDrawer}
      />

      {/* Complete Parking Facility Inventory Table */}
      <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground tracking-tight">
              Parking Perimeter Inventory & Telemetry
            </h3>
            <p className="text-xs text-muted-foreground">
              Real-time vehicle counting, fill velocity, and immediate operational overrides
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by ID or name..."
              className="w-48 text-xs h-8"
            />

            <select
              value={selectedZoneFilter}
              onChange={(e) => setSelectedZoneFilter(e.target.value)}
              className="rounded-md border border-border bg-card px-2.5 py-1 text-xs text-foreground focus:outline-hidden h-8"
            >
              <option value="ALL">All Sectors</option>
              <option value="Z01">Sector Z01</option>
              <option value="Z03">Sector Z03</option>
              <option value="Z04">Sector Z04</option>
              <option value="Z06">Sector Z06</option>
              <option value="Z07">Sector Z07</option>
            </select>

            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="rounded-md border border-border bg-card px-2.5 py-1 text-xs text-foreground focus:outline-hidden h-8"
            >
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">Available (&lt;70%)</option>
              <option value="BUSY">Busy (70-89%)</option>
              <option value="NEAR_CAPACITY">Near Capacity (90-99%)</option>
              <option value="FULL">Full (100%)</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/80 text-left text-muted-foreground font-medium">
                <th className="pb-2.5 pr-4">Parking Facility</th>
                <th className="pb-2.5 pr-4">Sector</th>
                <th className="pb-2.5 pr-4 font-mono">Total Capacity</th>
                <th className="pb-2.5 pr-4 font-mono">Occupied</th>
                <th className="pb-2.5 pr-4 font-mono">Available Bays</th>
                <th className="pb-2.5 pr-4">Occupancy Rate</th>
                <th className="pb-2.5 pr-4">Connecting Corridor</th>
                <th className="pb-2.5 pr-4">Trend</th>
                <th className="pb-2.5 pr-4">Telemetry Age</th>
                <th className="pb-2.5 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredLots.map((p) => {
                const occPct = Math.round((p.occupied / p.capacity) * 100);
                const freeBays = Math.max(0, p.capacity - p.occupied);
                const isSelected = selectedLotId === p.id;
                const corridorMeta = LOT_CORRIDOR_MAP[p.id];

                return (
                  <tr
                    key={p.id}
                    className={`transition-colors hover:bg-muted/30 cursor-pointer ${
                      isSelected ? "bg-primary/5" : ""
                    }`}
                    onClick={() => handleOpenDrawer(p.id)}
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-foreground bg-muted/60 border border-border/60 px-1.5 py-0.5 rounded text-[11px]">
                          {p.id}
                        </span>
                        <div>
                          <span className="font-semibold text-foreground block">{p.name}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {p.nearestGhat || "Ghat Concourse"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 pr-4 text-muted-foreground font-mono">
                      Sector {p.zoneId}
                    </td>

                    <td className="py-3 pr-4 font-mono font-medium">
                      {p.capacity.toLocaleString()}
                    </td>

                    <td className="py-3 pr-4 font-mono font-medium">
                      {p.occupied.toLocaleString()}
                    </td>

                    <td className="py-3 pr-4 font-mono font-bold">
                      <span className={freeBays <= 250 ? "text-rose-600" : "text-emerald-600"}>
                        {freeBays.toLocaleString()}
                      </span>
                    </td>

                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono font-bold ${
                            p.status === "CLOSED"
                              ? "text-muted-foreground"
                              : occPct >= 90
                              ? "text-rose-600"
                              : occPct >= 70
                              ? "text-amber-600"
                              : "text-emerald-600"
                          }`}
                        >
                          {p.status === "CLOSED" ? "CLOSED" : `${occPct}%`}
                        </span>
                        <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full ${
                              occPct >= 90
                                ? "bg-rose-500"
                                : occPct >= 70
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.min(100, occPct)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3 pr-4">
                      {corridorMeta ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-muted-foreground truncate max-w-[120px]">
                            {corridorMeta.corridorName}
                          </span>
                          <span
                            className={`rounded px-1 py-0.2 text-[9px] font-bold ${
                              corridorMeta.status === "CONGESTED"
                                ? "bg-rose-100 text-rose-700"
                                : corridorMeta.status === "BUSY"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {corridorMeta.status}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">Direct Link</span>
                      )}
                    </td>

                    <td className="py-3 pr-4">
                      <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 font-medium">
                        <TrendingUp className="h-3 w-3" />
                        Increasing
                      </span>
                    </td>

                    <td className="py-3 pr-4 text-muted-foreground font-mono text-[11px]">
                      {p.updatedMinutesAgo ? `${p.updatedMinutesAgo}m ago` : "21s ago"}
                    </td>

                    <td className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setLotToUpdate(p);
                            setIsUpdateModalOpen(true);
                          }}
                          className="h-7 px-2 text-[11px] text-primary hover:bg-primary/10"
                        >
                          Update
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDrawer(p.id)}
                          className="h-7 w-7 p-0"
                          title="Open Drawer"
                        >
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Parking Intelligence Drawer */}
      <ParkingIntelligenceDrawer
        lot={inspectedLot}
        zone={inspectedZone}
        routes={routes}
        allLots={allLots}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onUpdateOccupancy={(lot) => {
          setLotToUpdate(lot);
          setIsUpdateModalOpen(true);
        }}
        onMarkFull={handleMarkFull}
        onCloseParking={handleCloseLot}
        onReopenParking={handleReopenLot}
        onTriggerAdvisory={(from, to) => handleRedirectTraffic(from.id, to.id)}
        onViewDetail={(parkingId) =>
          navigate({ to: "/admin/parking/$parkingId", params: { parkingId } })
        }
      />

      {/* Update Occupancy Modal */}
      <UpdateOccupancyModal
        lot={lotToUpdate}
        isOpen={isUpdateModalOpen}
        onClose={() => {
          setIsUpdateModalOpen(false);
          setLotToUpdate(null);
        }}
      />
    </div>
  );
}
