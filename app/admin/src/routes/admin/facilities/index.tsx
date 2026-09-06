// Facilities Operations Control Room
// Real-time operations workspace for service availability, queue velocity, and pilgrim guidance
import React, { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getFacilities,
  getCrowdZones,
  getRoutes,
  setFacilityStatus,
  simulateFacilitySurge,
} from "@/services";
import {
  PageHeader,
  MetricCard,
  MetricStrip,
  MapPanel,
  MapLegend,
  LoadingState,
  FacilityIntelligenceDrawer,
  UpdateFacilityModal,
  ReportIssueModal,
  FacilitySmartComparisonCard,
  getFacilityTypeIcon,
} from "@/components/admin";
import { SearchInput } from "@/components/admin/FilterBar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Wrench,
  Clock,
  Zap,
  AlertTriangle,
  ArrowRight,
  Radio,
  Sliders,
  CheckCircle2,
  ShieldAlert,
  Droplets,
  HeartPulse,
  Accessibility,
  HelpCircle,
  Armchair,
  Layers,
} from "lucide-react";
import type { Facility, FacilityType } from "@/types";

export const Route = createFileRoute("/admin/facilities/")({ component: FacilitiesPage });

function FacilitiesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Queries
  const facilitiesQuery = useQuery({ queryKey: ["facilities"], queryFn: getFacilities });
  const zonesQuery = useQuery({ queryKey: ["crowd-zones"], queryFn: getCrowdZones });
  const routesQuery = useQuery({ queryKey: ["routes"], queryFn: getRoutes });

  // Filters
  const [search, setSearch] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("ALL");
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");

  // Selected Facility Drawer
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Modals
  const [facilityToUpdate, setFacilityToUpdate] = useState<Facility | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  const [facilityToReport, setFacilityToReport] = useState<Facility | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Demo Surge tracking
  const [isSurging, setIsSurging] = useState(false);

  if (facilitiesQuery.isLoading || zonesQuery.isLoading) {
    return <LoadingState />;
  }

  const allFacilities = facilitiesQuery.data ?? [];
  const zones = zonesQuery.data ?? [];
  const routes = routesQuery.data ?? [];

  // Selected facility object
  const inspectedFacility = allFacilities.find((f) => f.id === selectedFacilityId) || null;
  const inspectedZone = inspectedFacility
    ? zones.find((z) => z.id === inspectedFacility.zoneId) || null
    : null;

  // T12 Telemetry Reference for Demo Surge Button
  const t12Facility = allFacilities.find((f) => f.id === "T12");
  const isT12Surged = t12Facility
    ? t12Facility.queue === "HIGH" || t12Facility.waitMinutes >= 8
    : false;

  // KPI Calculations
  const totalCount = allFacilities.length;
  const openCount = allFacilities.filter((f) => f.status === "OPEN").length;
  const highQueueCount = allFacilities.filter(
    (f) => f.status !== "CLOSED" && (f.queue === "HIGH" || f.queue === "PEAK" || f.waitMinutes >= 8)
  ).length;
  const attentionCount = allFacilities.filter((f) => f.status === "NEEDS_ATTENTION").length;
  const avgWait =
    totalCount > 0
      ? Math.round(
          allFacilities
            .filter((f) => f.status !== "CLOSED")
            .reduce((acc, f) => acc + f.waitMinutes, 0) / Math.max(1, openCount)
        )
      : 0;

  // Filtered Table Facilities
  const filteredFacilities = allFacilities.filter((f) => {
    const matchesSearch =
      !search ||
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.id.toLowerCase().includes(search.toLowerCase());
    const matchesType = selectedTypeFilter === "ALL" || f.type === selectedTypeFilter;
    const matchesSector = selectedSectorFilter === "ALL" || f.zoneId === selectedSectorFilter;
    const matchesStatus =
      selectedStatusFilter === "ALL" ||
      (selectedStatusFilter === "OPEN" && f.status === "OPEN" && f.waitMinutes < 8) ||
      (selectedStatusFilter === "HIGH_QUEUE" && (f.queue === "HIGH" || f.waitMinutes >= 8)) ||
      (selectedStatusFilter === "NEEDS_ATTENTION" && f.status === "NEEDS_ATTENTION") ||
      (selectedStatusFilter === "CLOSED" && f.status === "CLOSED");

    return matchesSearch && matchesType && matchesSector && matchesStatus;
  });

  // Map Markers with 5 Operational States
  const mapMarkers = allFacilities.map((f) => {
    const isClosed = f.status === "CLOSED";
    const isNeedsAttention = f.status === "NEEDS_ATTENTION";
    const isLongQueue = !isClosed && (f.queue === "HIGH" || f.queue === "PEAK" || f.waitMinutes >= 8);
    const isBusy = !isClosed && !isLongQueue && (f.queue === "MODERATE" || f.waitMinutes >= 4);

    const badge: "OPEN" | "BUSY" | "LONG QUEUE" | "OUT OF SERVICE" | "UNKNOWN" = isClosed
      ? "OUT OF SERVICE"
      : isLongQueue
      ? "LONG QUEUE"
      : isBusy
      ? "BUSY"
      : isNeedsAttention
      ? "UNKNOWN"
      : "OPEN";

    const badgeBg =
      badge === "LONG QUEUE"
        ? "#ef4444"
        : badge === "BUSY"
        ? "#f59e0b"
        : badge === "OUT OF SERVICE"
        ? "#64748b"
        : badge === "UNKNOWN"
        ? "#8b5cf6"
        : "#10b981";

    return {
      id: f.id,
      point: f.point,
      label: f.name,
      category: "facility" as const,
      badge,
      badgeBg,
      details: `${f.type} · ${badge} (~${f.waitMinutes}m wait) · Capacity ${f.capacity}`,
    };
  });

  // Toggle Demo Surge
  const handleToggleSurge = async () => {
    setIsSurging(true);
    try {
      const nextState = !isT12Surged;
      await simulateFacilitySurge("T12", nextState);
      await queryClient.invalidateQueries({ queryKey: ["facilities"] });
      await queryClient.invalidateQueries({ queryKey: ["facility", "T12"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });

      if (nextState) {
        toast.warning("Simulated Surge Triggered: T12 set to 8 min wait (HIGH QUEUE)!", {
          description: "Perimeter sanitation warning dispatched. Pilgrim guidance to T08 suggested.",
        });
      } else {
        toast.info("Surge Reset: T12 queue restored to 2 min wait (LOW QUEUE).", {
          description: "Ramkund South sanitation load normalized.",
        });
      }
    } catch (err) {
      toast.error("Failed to toggle facility surge simulation.");
    } finally {
      setIsSurging(false);
    }
  };

  // Open Drawer Handler
  const handleOpenDrawer = (facilityId: string) => {
    setSelectedFacilityId(facilityId);
    setIsDrawerOpen(true);
  };

  // Close / Reopen Facility
  const handleCloseFacility = async (facility: Facility) => {
    try {
      await setFacilityStatus(facility.id, "CLOSED");
      await queryClient.invalidateQueries({ queryKey: ["facilities"] });
      toast.error(`${facility.id} (${facility.name}) marked OUT OF SERVICE.`);
    } catch (err) {
      toast.error("Failed to close facility.");
    }
  };

  const handleReopenFacility = async (facility: Facility) => {
    try {
      await setFacilityStatus(facility.id, "OPEN");
      await queryClient.invalidateQueries({ queryKey: ["facilities"] });
      toast.success(`${facility.id} (${facility.name}) re-opened for service.`);
    } catch (err) {
      toast.error("Failed to re-open facility.");
    }
  };

  // Guidance Trigger
  const handleDispatchGuidance = (from: Facility, to: Facility) => {
    toast.success(`PILGRIM GUIDANCE DISPATCHED: Guiding pilgrims from ${from.id} to ${to.id}`, {
      description: `Public display boards & volunteer app updated: divert to ${to.name} (~${to.waitMinutes}m wait).`,
      action: {
        label: "Create Broadcast",
        onClick: () =>
          navigate({
            to: "/alerts/create" as any,
            search: { zoneId: from.zoneId } as any,
          }),
      },
    });
  };

  // Find congested facility and best alternative for dynamic advisory
  const congestedFacility = allFacilities.find(
    (f) => f.status !== "CLOSED" && (f.queue === "HIGH" || f.waitMinutes >= 8)
  );
  const bestAlternative = congestedFacility
    ? allFacilities.find(
        (f) =>
          f.id !== congestedFacility.id &&
          f.type === congestedFacility.type &&
          f.status === "OPEN" &&
          f.waitMinutes <= 4
      )
    : null;

  return (
    <div className="space-y-5">
      {/* Header & Control Strip */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <PageHeader
          title="Facilities Operations Control"
          subtitle="Monitor service availability, queue velocity, and pilgrim sanitation & medical access across the Kumbh area."
        />

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Demo Surge Switcher */}
          <Button
            type="button"
            size="sm"
            onClick={handleToggleSurge}
            disabled={isSurging}
            className={`text-xs font-semibold h-8 gap-1.5 shadow-sm transition-all ${
              isT12Surged
                ? "bg-rose-600 hover:bg-rose-700 text-white border-rose-500 animate-pulse"
                : "bg-stone-900 hover:bg-stone-800 text-amber-300 border border-amber-500/40"
            }`}
          >
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            {isT12Surged ? "Reset Surge: T12 at 2m (LOW)" : "Simulate Surge: T12 at 8m (HIGH)"}
          </Button>

          {/* Telemetry Freshness */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-border/80 bg-card/80 px-2.5 py-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
            <span className="font-medium text-foreground">LIVE</span>
            <span>· Updated 28s ago</span>
          </div>

          <Button
            size="sm"
            variant="outline"
            className="text-xs h-8 gap-1.5"
            onClick={() => {
              if (t12Facility) {
                setFacilityToUpdate(t12Facility);
                setIsUpdateModalOpen(true);
              }
            }}
          >
            <Sliders className="h-3.5 w-3.5 text-primary" />
            Quick Update T12
          </Button>
        </div>
      </div>

      {/* Top 5 KPI Metric Cards */}
      <MetricStrip>
        <MetricCard
          label="Total Facilities"
          value={totalCount}
          icon={<Wrench className="h-4 w-4" />}
          variant="default"
        />
        <MetricCard
          label="Operational Open"
          value={openCount}
          variant="success"
        />
        <MetricCard
          label="High Queue / Overloaded"
          value={highQueueCount}
          variant={highQueueCount > 0 ? "critical" : "default"}
        />
        <MetricCard
          label="Needs Attention"
          value={attentionCount}
          variant={attentionCount > 0 ? "warning" : "default"}
        />
        <MetricCard
          label="Avg Pilgrim Wait"
          value={`~${avgWait} mins`}
          variant={avgWait >= 8 ? "critical" : avgWait >= 5 ? "warning" : "default"}
        />
      </MetricStrip>

      {/* Dynamic Operational Advisory Banner */}
      {congestedFacility ? (
        <div className="rounded-xl border border-rose-300 bg-rose-50/80 dark:bg-rose-950/40 dark:border-rose-800/70 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 mt-0.5">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-900 dark:text-rose-200">
                  Facility Congestion Advisory · Sector {congestedFacility.zoneId}
                </span>
                <span className="rounded bg-rose-200/60 dark:bg-rose-900/60 px-1.5 py-0.2 text-[10px] font-bold text-rose-800 dark:text-rose-200 font-mono">
                  {congestedFacility.id} · {congestedFacility.waitMinutes} MIN WAIT
                </span>
              </div>
              <p className="text-xs text-rose-950 dark:text-rose-100 leading-relaxed font-medium">
                <strong>{congestedFacility.name} ({congestedFacility.id})</strong> is experiencing heavy queue pressure with an estimated{" "}
                <strong>~{congestedFacility.waitMinutes} min wait ({congestedFacility.queue} QUEUE)</strong>.
                {bestAlternative && (
                  <span>
                    {" "}Nearest operational alternative <strong>{bestAlternative.name} ({bestAlternative.id})</strong> in Sector {bestAlternative.zoneId} has only a{" "}
                    <strong>~{bestAlternative.waitMinutes} min wait</strong>. Recommend guiding incoming pilgrims to relieve pressure.
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            {bestAlternative && (
              <Button
                type="button"
                size="sm"
                onClick={() => handleDispatchGuidance(congestedFacility, bestAlternative)}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs h-8 gap-1.5 shadow-xs"
              >
                <Radio className="h-3.5 w-3.5" />
                Guide to {bestAlternative.id}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleOpenDrawer(congestedFacility.id)}
              className="text-xs h-8 bg-card"
            >
              Inspect {congestedFacility.id}
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/20 dark:border-emerald-800/40 p-3 shadow-xs flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="font-semibold">Facility Perimeter Nominal:</span>
            <span>All sanitation blocks, drinking water points, and first-aid facilities are operating within nominal wait thresholds.</span>
          </div>
          <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
            {openCount} of {totalCount} Facilities Active
          </span>
        </div>
      )}

      {/* Primary Operations Workspace (68% Map + 32% Priority Panel) */}
      <div className="grid gap-4 lg:grid-cols-12 items-start">
        {/* Left Map Workspace (68% -> 8 cols) */}
        <div className="lg:col-span-8 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Perimeter Facilities Map & Queue Monitor
              </span>
              <span className="rounded bg-primary/10 px-1.5 py-0.2 text-[10px] font-bold text-primary font-mono">
                {allFacilities.length} Service Points
              </span>
            </div>

            <span className="text-[11px] text-muted-foreground hidden sm:inline">
              Click any facility marker to open the Live Intelligence Drawer
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
            selectedId={selectedFacilityId || undefined}
            onMarkerClick={handleOpenDrawer}
            height="560px"
            initialLayers={{
              facilities: true,
              crowd: true,
              routes: true,
              places: true,
              food: false,
              parking: false,
              gisNashik: true,
            }}
            allowedLayers={["facilities", "crowd", "routes", "food", "parking"]}
            legend={
              <MapLegend
                items={[
                  { color: "#10b981", label: "Open (<4m)" },
                  { color: "#f59e0b", label: "Busy (4-7m)" },
                  { color: "#ef4444", label: "Long Queue (≥8m)" },
                  { color: "#64748b", label: "Out of Service" },
                  { color: "#8b5cf6", label: "Unknown / Needs Attn" },
                ]}
              />
            }
          />
        </div>

        {/* Right Facility Priority Panel (32% -> 4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-orange-500" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Facility Priority Panel
                </h3>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">
                Ranked by Queue Pressure
              </span>
            </div>

            {/* Prompt's exact examples: T12, M03, W07 and other priority items */}
            <div className="space-y-2">
              {[...allFacilities]
                .sort((a, b) => b.waitMinutes - a.waitMinutes)
                .slice(0, 6)
                .map((f) => {
                  const isLongQueue = f.status !== "CLOSED" && (f.queue === "HIGH" || f.waitMinutes >= 8);
                  const isSelected = selectedFacilityId === f.id;

                  return (
                    <div
                      key={f.id}
                      onClick={() => handleOpenDrawer(f.id)}
                      className={`group cursor-pointer rounded-lg border p-2.5 transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/40"
                          : isLongQueue
                          ? "border-rose-200 bg-rose-50/40 dark:bg-rose-950/20 hover:border-rose-300"
                          : "border-border/60 bg-muted/20 hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-foreground">
                            {f.id}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-muted/70 text-muted-foreground">
                            {f.type}
                          </span>
                          <span className="text-xs font-medium text-foreground truncate max-w-[110px]">
                            {(f.name?.split("(")[0] ?? f.name ?? "").trim()}
                          </span>
                        </div>

                        <span
                          className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                            f.status === "CLOSED"
                              ? "bg-stone-200 text-stone-700"
                              : isLongQueue
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                              : f.queue === "MODERATE"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {f.status === "CLOSED"
                            ? "OUT OF SERVICE"
                            : isLongQueue
                            ? "HIGH QUEUE"
                            : f.queue === "MODERATE"
                            ? "BUSY"
                            : "AVAILABLE"}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>
                          Sector {f.zoneId} · Capacity {f.capacity}
                        </span>
                        <span
                          className={
                            f.waitMinutes >= 8
                              ? "font-bold text-rose-600 dark:text-rose-400"
                              : "font-medium text-foreground"
                          }
                        >
                          {f.waitMinutes > 0 ? `${f.waitMinutes} min wait` : "No wait"}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Quick Facility Category Distribution Card */}
          <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Service Category Overview
                </h3>
              </div>
              <span className="text-[10px] text-muted-foreground">Active Roster</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { type: "TOILET", label: "Toilets", icon: Accessibility, count: allFacilities.filter(f => f.type === "TOILET").length },
                { type: "WATER", label: "Water Points", icon: Droplets, count: allFacilities.filter(f => f.type === "WATER").length },
                { type: "MEDICAL", label: "Medical Posts", icon: HeartPulse, count: allFacilities.filter(f => f.type === "MEDICAL").length },
                { type: "HELP", label: "Help Desks", icon: HelpCircle, count: allFacilities.filter(f => f.type === "HELP").length },
              ].map((cat) => {
                const Icon = cat.icon;
                return (
                  <div key={cat.type} className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/40">
                    <div className="flex items-center gap-1.5">
                      <Icon className="h-3.5 w-3.5 text-primary" />
                      <span className="text-[11px] font-medium">{cat.label}</span>
                    </div>
                    <span className="font-mono font-bold">{cat.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Smart Comparison Matrix */}
      <FacilitySmartComparisonCard
        allFacilities={allFacilities}
        zones={zones}
        onInspectFacility={handleOpenDrawer}
        onDispatchGuidance={handleDispatchGuidance}
      />

      {/* Complete Facility Inventory Table */}
      <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground tracking-tight">
              Facility Perimeter Inventory & Telemetry
            </h3>
            <p className="text-xs text-muted-foreground">
              Real-time service operational state, queue pressure, and immediate maintenance overrides
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search facility..."
              className="w-48 text-xs h-8"
            />

            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="rounded-md border border-border bg-card px-2.5 py-1 text-xs text-foreground focus:outline-hidden h-8"
            >
              <option value="ALL">All Types</option>
              <option value="TOILET">Toilets</option>
              <option value="WATER">Water</option>
              <option value="MEDICAL">Medical</option>
              <option value="HELP">Help Desks</option>
              <option value="REST">Rest Areas</option>
            </select>

            <select
              value={selectedSectorFilter}
              onChange={(e) => setSelectedSectorFilter(e.target.value)}
              className="rounded-md border border-border bg-card px-2.5 py-1 text-xs text-foreground focus:outline-hidden h-8"
            >
              <option value="ALL">All Sectors</option>
              <option value="Z01">Sector Z01</option>
              <option value="Z02">Sector Z02</option>
              <option value="Z03">Sector Z03</option>
              <option value="Z04">Sector Z04</option>
              <option value="Z05">Sector Z05</option>
              <option value="Z06">Sector Z06</option>
              <option value="Z07">Sector Z07</option>
              <option value="Z08">Sector Z08</option>
            </select>

            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="rounded-md border border-border bg-card px-2.5 py-1 text-xs text-foreground focus:outline-hidden h-8"
            >
              <option value="ALL">All Operational States</option>
              <option value="OPEN">Open (Low Wait)</option>
              <option value="HIGH_QUEUE">High Queue (≥8m)</option>
              <option value="NEEDS_ATTENTION">Needs Attention</option>
              <option value="CLOSED">Out of Service</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/80 text-left text-muted-foreground font-medium">
                <th className="pb-2.5 pr-4">Facility</th>
                <th className="pb-2.5 pr-4">Type</th>
                <th className="pb-2.5 pr-4">Sector</th>
                <th className="pb-2.5 pr-4">State</th>
                <th className="pb-2.5 pr-4">Queue Pressure</th>
                <th className="pb-2.5 pr-4 font-mono">Est. Wait</th>
                <th className="pb-2.5 pr-4 font-mono">Capacity</th>
                <th className="pb-2.5 pr-4">Accessibility</th>
                <th className="pb-2.5 pr-4">Last Inspection</th>
                <th className="pb-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredFacilities.map((f) => {
                const isSelected = selectedFacilityId === f.id;
                const isClosed = f.status === "CLOSED";
                const isLongQueue = !isClosed && (f.queue === "HIGH" || f.waitMinutes >= 8);

                return (
                  <tr
                    key={f.id}
                    className={`transition-colors hover:bg-muted/30 cursor-pointer ${
                      isSelected ? "bg-primary/5" : ""
                    }`}
                    onClick={() => handleOpenDrawer(f.id)}
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-foreground bg-muted/60 border border-border/60 px-1.5 py-0.5 rounded text-[11px]">
                          {f.id}
                        </span>
                        <div>
                          <span className="font-semibold text-foreground block">{f.name}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {f.updatedMinutesAgo ? `${f.updatedMinutesAgo}m ago` : "Live telemetry"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        {getFacilityTypeIcon(f.type, "h-3.5 w-3.5")}
                        <span className="font-semibold text-[11px]">{f.type}</span>
                      </div>
                    </td>

                    <td className="py-3 pr-4 text-muted-foreground font-mono">
                      Sector {f.zoneId}
                    </td>

                    <td className="py-3 pr-4">
                      <span
                        className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                          f.status === "CLOSED"
                            ? "bg-stone-200 text-stone-700"
                            : isLongQueue
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                            : f.queue === "MODERATE"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {f.status === "CLOSED"
                          ? "OUT OF SERVICE"
                          : isLongQueue
                          ? "LONG QUEUE"
                          : f.queue === "MODERATE"
                          ? "BUSY"
                          : "OPEN"}
                      </span>
                    </td>

                    <td className="py-3 pr-4 font-semibold uppercase text-[11px]">
                      {f.queue}
                    </td>

                    <td className="py-3 pr-4 font-mono font-bold">
                      <span className={f.waitMinutes >= 8 ? "text-rose-600" : "text-emerald-600"}>
                        {f.waitMinutes > 0 ? `~${f.waitMinutes} mins` : "—"}
                      </span>
                    </td>

                    <td className="py-3 pr-4 font-mono font-medium">
                      {f.capacity}
                    </td>

                    <td className="py-3 pr-4">
                      {f.accessible ? (
                        <span className="text-emerald-600 font-medium flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Yes
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Standard</span>
                      )}
                    </td>

                    <td className="py-3 pr-4 text-muted-foreground text-[11px] truncate max-w-[140px]">
                      {f.lastInspection}
                    </td>

                    <td className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFacilityToUpdate(f);
                            setIsUpdateModalOpen(true);
                          }}
                          className="h-7 px-2 text-[11px] text-primary hover:bg-primary/10"
                        >
                          Queue
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFacilityToReport(f);
                            setIsReportModalOpen(true);
                          }}
                          className="h-7 px-2 text-[11px] text-amber-600 hover:bg-amber-50"
                        >
                          Issue
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDrawer(f.id)}
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

      {/* Live Facility Intelligence Drawer */}
      <FacilityIntelligenceDrawer
        facility={inspectedFacility}
        zone={inspectedZone}
        allFacilities={allFacilities}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onUpdateStatus={(f) => {
          setFacilityToUpdate(f);
          setIsUpdateModalOpen(true);
        }}
        onUpdateQueue={(f) => {
          setFacilityToUpdate(f);
          setIsUpdateModalOpen(true);
        }}
        onReportIssue={(f) => {
          setFacilityToReport(f);
          setIsReportModalOpen(true);
        }}
        onCloseFacility={handleCloseFacility}
        onReopenFacility={handleReopenFacility}
        onViewDetail={(id) =>
          navigate({ to: "/admin/facilities/$facilityId", params: { facilityId: id } })
        }
        onSelectAlternative={(id) => handleOpenDrawer(id)}
      />

      {/* Update Facility Queue & Status Modal */}
      <UpdateFacilityModal
        facility={facilityToUpdate}
        isOpen={isUpdateModalOpen}
        onClose={() => {
          setIsUpdateModalOpen(false);
          setFacilityToUpdate(null);
        }}
      />

      {/* Report Issue Modal */}
      <ReportIssueModal
        facility={facilityToReport}
        isOpen={isReportModalOpen}
        onClose={() => {
          setIsReportModalOpen(false);
          setFacilityToReport(null);
        }}
      />
    </div>
  );
}
