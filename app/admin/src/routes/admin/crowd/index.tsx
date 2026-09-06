// Crowd Intelligence — Operations Control Room Workspace
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCrowdZones,
  getDashboardStats,
  getRoutes,
  getFacilities,
  getKitchens,
  setZoneCrowd,
  setRouteStatus,
} from "@/services";
import {
  PageHeader,
  MetricCard,
  MetricStrip,
  MapPanel,
  MapLegend,
  StatusBadge,
  SeverityBadge,
  TrendIndicator,
  FilterBar,
  SearchInput,
  SelectFilter,
  ZoneIntelligenceDrawer,
  DiversionModal,
  LoadingState,
} from "@/components/admin";
import {
  Users,
  AlertTriangle,
  TrendingUp,
  Clock,
  ShieldAlert,
  ArrowRight,
  Eye,
  Radio,
  Navigation,
  Compass,
  RotateCcw,
  Sliders,
  Play,
  Pause,
  Sparkles,
  Flame,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import type { Zone, RouteLink, CrowdLevel, Trend } from "@/types";

export const Route = createFileRoute("/admin/crowd/")({
  component: CrowdIntelligencePage,
});

function CrowdIntelligencePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [trendFilter, setTrendFilter] = useState("ALL");
  const [confidenceFilter, setConfidenceFilter] = useState("ALL");
  const [timeInterval, setTimeInterval] = useState<"LIVE" | "15m" | "1h" | "3h" | "CUSTOM">("LIVE");

  // Time Playback Scrubber state (minutes offset from now: 0 = LIVE, -15, -30, -45, -60)
  const [timeOffsetMinutes, setTimeOffsetMinutes] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Map & Drawer state
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [focusedZoneId, setFocusedZoneId] = useState<string | undefined>(undefined);
  const [movementMode, setMovementMode] = useState(false);
  const [diversionModalOpen, setDiversionModalOpen] = useState(false);
  const [diversionZoneId, setDiversionZoneId] = useState("Z07");

  // Table Sorting
  const [sortField, setSortField] = useState<"crowd" | "pressure" | "trend" | "updated">("pressure");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Freshness timer
  const [secondsAgo, setSecondsAgo] = useState(12);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsAgo((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Time playback animation
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setTimeOffsetMinutes((prev) => {
        if (prev >= 0) {
          setIsPlaying(false);
          return 0;
        }
        return Math.min(0, prev + 15);
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Queries
  const zonesQuery = useQuery({ queryKey: ["zones"], queryFn: getCrowdZones });
  const statsQuery = useQuery({ queryKey: ["dashboard-stats"], queryFn: getDashboardStats });
  const routesQuery = useQuery({ queryKey: ["routes"], queryFn: getRoutes });
  const facilitiesQuery = useQuery({ queryKey: ["facilities"], queryFn: getFacilities });
  const kitchensQuery = useQuery({ queryKey: ["kitchens"], queryFn: getKitchens });

  const rawZones = zonesQuery.data ?? [];
  const rawRoutes = routesQuery.data ?? [];
  const facilities = facilitiesQuery.data ?? [];
  const kitchens = kitchensQuery.data ?? [];

  // Modulate zones based on simulated time playback offset
  const allZones = useMemo(() => {
    if (timeOffsetMinutes === 0) return rawZones;

    // Simulate historical crowd progression
    return rawZones.map((z) => {
      if (timeOffsetMinutes === -60) {
        if (z.id === "Z07") return { ...z, crowd: "MODERATE" as CrowdLevel, trend: "STABLE" as Trend, pilgrims: 1420 };
        if (z.id === "Z08") return { ...z, crowd: "HIGH" as CrowdLevel, trend: "INCREASING" as Trend, pilgrims: 1650 };
        return { ...z, pilgrims: Math.round(z.pilgrims * 0.75) };
      }
      if (timeOffsetMinutes === -45) {
        if (z.id === "Z07") return { ...z, crowd: "MODERATE" as CrowdLevel, trend: "INCREASING" as Trend, pilgrims: 1680 };
        if (z.id === "Z08") return { ...z, crowd: "HIGH" as CrowdLevel, trend: "INCREASING" as Trend, pilgrims: 1820 };
        return { ...z, pilgrims: Math.round(z.pilgrims * 0.82) };
      }
      if (timeOffsetMinutes === -30) {
        if (z.id === "Z07") return { ...z, crowd: "HIGH" as CrowdLevel, trend: "INCREASING" as Trend, pilgrims: 1940 };
        if (z.id === "Z08") return { ...z, crowd: "PEAK" as CrowdLevel, trend: "INCREASING" as Trend, pilgrims: 1980 };
        return { ...z, pilgrims: Math.round(z.pilgrims * 0.9) };
      }
      if (timeOffsetMinutes === -15) {
        if (z.id === "Z07") return { ...z, crowd: "HIGH" as CrowdLevel, trend: "INCREASING" as Trend, pilgrims: 2080 };
        return { ...z, pilgrims: Math.round(z.pilgrims * 0.96) };
      }
      return z;
    });
  }, [rawZones, timeOffsetMinutes]);

  if (zonesQuery.isLoading || statsQuery.isLoading) return <LoadingState />;

  // Demo Scenario Surge Handler (Z07 PEAK, R17 CONGESTED)
  const isSurgeActive = allZones.find((z) => z.id === "Z07")?.crowd === "PEAK";

  const handleToggleSurge = async () => {
    if (isSurgeActive) {
      await setZoneCrowd("Z07", "HIGH");
      await setRouteStatus("R17", "RECOMMENDED");
      qc.invalidateQueries({ queryKey: ["zones"] });
      qc.invalidateQueries({ queryKey: ["routes"] });
      toast.info("Demo Scenario reset: Zone 07 set to HIGH, Route R17 set to RECOMMENDED");
    } else {
      await setZoneCrowd("Z07", "PEAK");
      await setRouteStatus("R17", "CONGESTED");
      qc.invalidateQueries({ queryKey: ["zones"] });
      qc.invalidateQueries({ queryKey: ["routes"] });
      toast.warning("Simulated surge applied: Zone 07 is now PEAK, Route R17 is CONGESTED!");
    }
  };

  // Filtered zones
  const filteredZones = allZones.filter((z) => {
    if (search && !z.name.toLowerCase().includes(search.toLowerCase()) && !z.id.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (zoneFilter !== "ALL" && z.id !== zoneFilter) return false;
    if (statusFilter !== "ALL" && z.crowd !== statusFilter) return false;
    if (trendFilter !== "ALL" && z.trend !== trendFilter) return false;
    if (confidenceFilter !== "ALL" && z.confidence !== confidenceFilter) return false;
    return true;
  });

  // Calculate pressure percentage helper
  const getPressurePct = (zone: Zone) => {
    return zone.crowd === "PEAK" ? 94 : zone.crowd === "HIGH" ? 78 : zone.crowd === "MODERATE" ? 54 : 28;
  };

  // Sorted zones for secondary table
  const sortedZones = [...filteredZones].sort((a, b) => {
    let diff = 0;
    if (sortField === "pressure") {
      diff = getPressurePct(b) - getPressurePct(a);
    } else if (sortField === "crowd") {
      const order: Record<string, number> = { PEAK: 4, HIGH: 3, MODERATE: 2, LOW: 1 };
      diff = (order[b.crowd] || 0) - (order[a.crowd] || 0);
    } else if (sortField === "trend") {
      const order: Record<string, number> = { INCREASING: 3, STABLE: 2, DECREASING: 1 };
      diff = (order[b.trend] || 0) - (order[a.trend] || 0);
    } else if (sortField === "updated") {
      diff = a.updatedMinutesAgo - b.updatedMinutesAgo;
    }
    return sortOrder === "asc" ? -diff : diff;
  });

  // Pressure points ranking
  const pressurePoints = [
    {
      rank: "01",
      id: "Z07",
      name: "Zone 07 — Kushavarta Feeder",
      status: allZones.find((z) => z.id === "Z07")?.crowd || "HIGH",
      trend: "INCREASING",
      trendDelta: "+14%",
      pressure: getPressurePct(allZones.find((z) => z.id === "Z07") ?? allZones[0] ?? ({ pilgrims: 2140 } as Zone)),
      criticalImpact: "Critical route impact on R17",
      severity: "critical" as const,
    },
    {
      rank: "02",
      id: "Z08",
      name: "Zone 08 — Main Snan Ghat",
      status: allZones.find((z) => z.id === "Z08")?.crowd || "PEAK",
      trend: "INCREASING",
      trendDelta: "+8%",
      pressure: getPressurePct(allZones.find((z) => z.id === "Z08") ?? allZones[0] ?? ({ pilgrims: 2010 } as Zone)),
      criticalImpact: "Ghat step access pressure",
      severity: "critical" as const,
    },
    {
      rank: "03",
      id: "Z05",
      name: "Zone 05 — Gadge Maharaj Bridge",
      status: allZones.find((z) => z.id === "Z05")?.crowd || "HIGH",
      trend: "STABLE",
      trendDelta: "0%",
      pressure: 72,
      criticalImpact: "Bridge walkway bottleneck",
      severity: "warning" as const,
    },
    {
      rank: "04",
      id: "Z04",
      name: "Zone 04 — Ramkund Ghat Belt",
      status: allZones.find((z) => z.id === "Z04")?.crowd || "MODERATE",
      trend: "STABLE",
      trendDelta: "-2%",
      pressure: 58,
      criticalImpact: "Ghat buffer perimeter",
      severity: "default" as const,
    },
  ];

  const selectedZone = allZones.find((z) => z.id === selectedZoneId) || null;

  const handleResetFilters = () => {
    setSearch("");
    setZoneFilter("ALL");
    setStatusFilter("ALL");
    setTrendFilter("ALL");
    setConfidenceFilter("ALL");
    setTimeInterval("LIVE");
    setTimeOffsetMinutes(0);
  };

  return (
    <div className="space-y-5">
      {/* Header Section */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground font-sans">
              Crowd Intelligence
            </h1>
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Live crowd movement, density corridors and operational pressure across the operational area.
          </p>
        </div>

        {/* Right side telemetry & Demo trigger */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Demo Surge Scenario Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleToggleSurge}
            className={`text-xs gap-1.5 border font-semibold ${
              isSurgeActive
                ? "border-rose-400 bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
                : "border-amber-400/80 bg-amber-50/50 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/20 dark:text-amber-300"
            }`}
            title="Demonstrate Scenario 4: Simulate Surge at Zone 07 and Congestion on Route R17"
          >
            <Flame className="h-3.5 w-3.5 text-rose-500" />
            <span>{isSurgeActive ? "Surge Active (Reset)" : "Simulate Surge (Z07/R17)"}</span>
          </Button>

          {/* Freshness & Auto-refresh */}
          <div className="flex items-center gap-2 rounded-lg border border-border/80 bg-card/90 px-3 py-1.5 text-xs shadow-2xs">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground font-mono text-[11px]">
              {secondsAgo < 60 ? `Updated ${secondsAgo}s ago` : `Updated ${Math.floor(secondsAgo / 60)}m ago`}
            </span>
            <button
              type="button"
              onClick={() => {
                setSecondsAgo(0);
                qc.invalidateQueries({ queryKey: ["zones"] });
                toast.success("Crowd telemetry re-synced");
              }}
              className="ml-1 text-primary hover:text-primary/80 transition-colors"
              title="Manual Refresh"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Intelligence Toolbar */}
      <div className="rounded-xl border border-border/80 bg-card p-3 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Time Interval Pills */}
          <div className="flex items-center gap-1 rounded-lg border border-border/80 bg-muted/30 p-1">
            {(["LIVE", "15m", "1h", "3h", "CUSTOM"] as const).map((interval) => (
              <button
                key={interval}
                type="button"
                onClick={() => {
                  setTimeInterval(interval);
                  if (interval === "LIVE") setTimeOffsetMinutes(0);
                  if (interval === "15m") setTimeOffsetMinutes(-15);
                  if (interval === "1h") setTimeOffsetMinutes(-60);
                }}
                className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-all ${
                  timeInterval === interval
                    ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {interval === "LIVE" ? "● Live" : interval}
              </button>
            ))}
          </div>

          {/* Quick Stats Micro Strip */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>
              Active: <b className="text-foreground font-mono">{allZones.reduce((a, b) => a + b.pilgrims, 0).toLocaleString()}</b>
            </span>
            <span className="h-3 w-px bg-border" />
            <span>
              High: <b className="text-amber-600 font-mono">{allZones.filter((z) => z.crowd === "HIGH").length}</b>
            </span>
            <span className="h-3 w-px bg-border" />
            <span>
              Peak: <b className="text-rose-600 font-mono">{allZones.filter((z) => z.crowd === "PEAK").length}</b>
            </span>
            <span className="h-3 w-px bg-border" />
            <span>
              Surging: <b className="text-primary font-mono">{allZones.filter((z) => z.trend === "INCREASING").length}</b>
            </span>
          </div>
        </div>

        {/* Filter Bar Row */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/60">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search sector or ID..."
            className="w-48 h-8 text-xs"
          />

          <SelectFilter
            value={zoneFilter}
            onChange={setZoneFilter}
            options={[
              { value: "ALL", label: "All Zones" },
              ...allZones.map((z) => ({ value: z.id, label: `${z.id} — ${z.name}` })),
            ]}
          />

          <SelectFilter
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "ALL", label: "Status: All" },
              { value: "PEAK", label: "Peak (>90%)" },
              { value: "HIGH", label: "High (70-90%)" },
              { value: "MODERATE", label: "Moderate (40-70%)" },
              { value: "LOW", label: "Normal / Low (<40%)" },
            ]}
          />

          <SelectFilter
            value={trendFilter}
            onChange={setTrendFilter}
            options={[
              { value: "ALL", label: "Trend: All" },
              { value: "INCREASING", label: "Increasing (Surge)" },
              { value: "STABLE", label: "Stable Flow" },
              { value: "DECREASING", label: "Decreasing" },
            ]}
          />

          <SelectFilter
            value={confidenceFilter}
            onChange={setConfidenceFilter}
            options={[
              { value: "ALL", label: "Confidence: All" },
              { value: "HIGH", label: "High (>85%)" },
              { value: "MEDIUM", label: "Medium (60-85%)" },
            ]}
          />

          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="h-8 text-xs text-muted-foreground hover:text-foreground ml-auto"
          >
            Reset filters
          </Button>
        </div>

        {/* Time Playback Scrubber Bar */}
        <div className="flex items-center gap-3 pt-2 border-t border-border/60 text-xs">
          <div className="flex items-center gap-1 text-muted-foreground font-semibold">
            <Sliders className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] uppercase tracking-wider">Time Playback:</span>
          </div>

          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex h-6 w-6 items-center justify-center rounded border border-border bg-background hover:bg-muted text-foreground"
            title={isPlaying ? "Pause Playback" : "Play Historical Simulation"}
          >
            {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 fill-current" />}
          </button>

          <span className="text-[11px] text-muted-foreground font-mono">← -60m</span>

          <input
            type="range"
            min={-60}
            max={0}
            step={15}
            value={timeOffsetMinutes}
            onChange={(e) => {
              setTimeOffsetMinutes(Number(e.target.value));
              if (Number(e.target.value) === 0) setTimeInterval("LIVE");
            }}
            className="h-1.5 flex-1 cursor-pointer accent-primary bg-muted rounded-lg"
          />

          <span className="text-[11px] text-muted-foreground font-mono">NOW →</span>

          <span
            className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
              timeOffsetMinutes === 0
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
            }`}
          >
            {timeOffsetMinutes === 0 ? "LIVE STATE" : `${timeOffsetMinutes} min (Playback)`}
          </span>

          {timeOffsetMinutes !== 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setTimeOffsetMinutes(0)}
              className="h-6 px-2 text-[10px]"
            >
              Return to Live
            </Button>
          )}
        </div>
      </div>

      {/* PRIMARY WORKSPACE: Map (68%) & Crowd Pressure Points (32%) */}
      <div className="grid gap-5 lg:grid-cols-12 items-start">
        {/* Dominant Map Workspace (approx 68% / 8 columns) */}
        <div className="lg:col-span-8 space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Primary GIS Workspace · Godavari Basin
              </span>
              <span className="text-[10px] rounded bg-muted px-1.5 py-0.2 font-mono text-muted-foreground">
                8 Operational Sectors
              </span>
            </div>

            {selectedZone && (
              <span className="text-xs font-semibold text-primary flex items-center gap-1">
                Inspecting: {selectedZone.name} ({selectedZone.id})
              </span>
            )}
          </div>

          <MapPanel
            zones={filteredZones}
            selectedId={selectedZoneId || undefined}
            focusedZoneId={focusedZoneId}
            movementMode={movementMode}
            onMovementModeChange={setMovementMode}
            onZoneClick={(zoneId) => {
              setSelectedZoneId(zoneId);
              setFocusedZoneId(zoneId);
            }}
            routes={rawRoutes.map((r) => ({
              path: r.path,
              color:
                r.status === "RECOMMENDED"
                  ? "#22c55e"
                  : r.status === "CONGESTED"
                  ? "#f97316"
                  : r.status === "CLOSED"
                  ? "#ef4444"
                  : "#eab308",
              dashed: r.status === "CLOSED" || r.status === "DIVERSION",
              name: r.id,
              status: r.status,
            }))}
            markers={[
              ...facilities.map((f) => ({
                id: f.id,
                point: f.point,
                label: f.name.split(" ")[0],
                color: f.status === "OPEN" ? "#2563eb" : "#ef4444",
                category: "facility" as const,
                size: "sm" as const,
              })),
              ...kitchens.map((k) => ({
                id: k.id,
                point: k.point,
                label: k.name.split(" ")[0],
                color: "#16a34a",
                category: "food" as const,
                size: "sm" as const,
              })),
            ]}
            height="560px"
            initialLayers={{
              crowd: true,
              routes: true,
              parking: false,
              food: false,
              facilities: false,
              places: false,
            }}
            legend={
              <MapLegend
                items={[
                  { color: "#22c55e", label: "Normal (<40%)" },
                  { color: "#eab308", label: "Moderate (40-70%)" },
                  { color: "#f97316", label: "High (70-90%)" },
                  { color: "#ef4444", label: "Peak (>90%)" },
                  { color: "#3b82f6", label: "Corridors" },
                ]}
              />
            }
          />
        </div>

        {/* CROWD PRESSURE POINTS (Dedicated Right-Side Panel, 32% / 4 columns) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <Flame className="h-4 w-4 text-rose-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                Crowd Pressure Points
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">Ranked Priority</span>
          </div>

          <div className="space-y-2.5">
            {pressurePoints.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedZoneId(item.id);
                  setFocusedZoneId(item.id);
                }}
                className={`cursor-pointer rounded-xl border p-3.5 transition-all hover:shadow-md select-none ${
                  selectedZoneId === item.id
                    ? "border-primary bg-primary/5 ring-2 ring-primary/40"
                    : item.status === "PEAK"
                    ? "border-rose-300 bg-rose-50/40 dark:bg-rose-950/20 hover:border-rose-400"
                    : item.status === "HIGH"
                    ? "border-amber-300 bg-amber-50/40 dark:bg-amber-950/20 hover:border-amber-400"
                    : "border-border/80 bg-card hover:bg-muted/30"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-stone-900 text-white font-mono text-[10px] font-bold">
                      {item.rank}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">{item.name}</h4>
                      <p className="text-[11px] text-muted-foreground">{item.criticalImpact}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        item.status === "PEAK"
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          : item.status === "HIGH"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      }`}
                    >
                      {item.status}
                    </span>
                    <span className="block mt-0.5 font-mono text-[11px] font-bold text-foreground">
                      {item.pressure}%
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between border-t border-border/50 pt-2 text-[11px]">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-primary" />
                    Trend: <b className="text-foreground">{item.trend}</b> ({item.trendDelta})
                  </span>
                  <span className="text-primary font-semibold flex items-center gap-0.5 hover:underline">
                    Inspect Drawer <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Action Box */}
          <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5 text-xs space-y-2">
            <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider block">
              Quick Operations Actions
            </span>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-[11px] h-8 gap-1"
                onClick={() => {
                  setDiversionZoneId("Z07");
                  setDiversionModalOpen(true);
                }}
              >
                <Compass className="h-3 w-3 text-primary" /> Diversion (R17)
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-[11px] h-8 gap-1 text-rose-600 hover:text-rose-700"
                onClick={() => navigate({ to: "/admin/alerts/create", search: { zoneId: "Z07", severity: "CRITICAL", title: undefined } })}
              >
                <ShieldAlert className="h-3 w-3" /> Broadcast Alert
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* SECONDARY CROWD TABLE */}
      <div className="rounded-xl border border-border/80 bg-card shadow-xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/80 px-5 py-3.5 bg-muted/20">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">Sector Roster & Telemetry Data</h3>
            <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
              {sortedZones.length} Sectors
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Sort by:</span>
            {(["pressure", "crowd", "trend", "updated"] as const).map((field) => (
              <button
                key={field}
                type="button"
                onClick={() => {
                  if (sortField === field) {
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  } else {
                    setSortField(field);
                    setSortOrder("desc");
                  }
                }}
                className={`rounded px-2 py-1 capitalize transition-colors ${
                  sortField === field ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-muted"
                }`}
              >
                {field} {sortField === field && (sortOrder === "asc" ? "↑" : "↓")}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border/80 bg-muted/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Zone</th>
                <th className="px-4 py-3">Current</th>
                <th className="px-4 py-3">Trend</th>
                <th className="px-4 py-3">Pressure</th>
                <th className="px-4 py-3">Affected Routes</th>
                <th className="px-4 py-3">Confidence</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {sortedZones.map((zone) => {
                const pressure = getPressurePct(zone);
                return (
                  <tr
                    key={zone.id}
                    onClick={() => {
                      setSelectedZoneId(zone.id);
                      setFocusedZoneId(zone.id);
                    }}
                    className={`cursor-pointer transition-colors hover:bg-muted/30 ${
                      selectedZoneId === zone.id ? "bg-primary/5 font-medium" : ""
                    }`}
                  >
                    <td className="px-5 py-3 font-medium">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-primary font-mono text-[10px] font-bold">
                          {zone.id}
                        </span>
                        <div>
                          <span className="font-semibold text-foreground">{zone.name}</span>
                          <span className="text-muted-foreground block text-[10px]">{zone.area}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge value={zone.crowd} kind="crowd" />
                    </td>

                    <td className="px-4 py-3">
                      <TrendIndicator trend={zone.trend} />
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs">{pressure}%</span>
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full ${
                              pressure > 85 ? "bg-rose-500" : pressure > 70 ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${pressure}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {zone.id === "Z07" ? (
                        <span className="rounded bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 px-1.5 py-0.5 font-mono text-[10px] font-semibold">
                          R17 (Congested)
                        </span>
                      ) : zone.id === "Z08" ? (
                        <span className="rounded bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 px-1.5 py-0.5 font-mono text-[10px] font-semibold">
                          R21 (Closed)
                        </span>
                      ) : (
                        <span className="text-muted-foreground font-mono text-[10px]">Normal Flow</span>
                      )}
                    </td>

                    <td className="px-4 py-3 font-mono text-[11px]">
                      {zone.confidence === "HIGH" ? "94% High" : "76% Med"}
                    </td>

                    <td className="px-4 py-3 text-muted-foreground font-mono text-[11px]">
                      {zone.updatedMinutesAgo === 0 ? "34s ago" : `${zone.updatedMinutesAgo}m ago`}
                    </td>

                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-[11px] gap-1"
                          onClick={() => {
                            setSelectedZoneId(zone.id);
                            setFocusedZoneId(zone.id);
                          }}
                        >
                          <Eye className="h-3 w-3" /> Inspect
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-[11px] gap-1"
                          onClick={() => navigate({ to: "/admin/crowd/$zoneId", params: { zoneId: zone.id } })}
                        >
                          <span>View</span>
                          <ArrowRight className="h-3 w-3" />
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

      {/* Contextual Intelligence Drawer */}
      <ZoneIntelligenceDrawer
        zone={selectedZone}
        routes={rawRoutes}
        facilities={facilities}
        kitchens={kitchens}
        isOpen={!!selectedZoneId}
        onClose={() => setSelectedZoneId(null)}
        onViewZone={(zoneId) => navigate({ to: "/admin/crowd/$zoneId", params: { zoneId } })}
        onCreateAlert={(zoneId) => navigate({ to: "/admin/alerts/create", search: { zoneId, severity: "WARNING", title: undefined } })}
        onRecommendDiversion={(zoneId) => {
          setDiversionZoneId(zoneId);
          setDiversionModalOpen(true);
        }}
      />

      {/* Diversion Action Modal */}
      <DiversionModal
        isOpen={diversionModalOpen}
        onClose={() => setDiversionModalOpen(false)}
        zoneId={diversionZoneId}
        sourceRouteId="R17"
        targetRouteId="R18"
      />
    </div>
  );
}
