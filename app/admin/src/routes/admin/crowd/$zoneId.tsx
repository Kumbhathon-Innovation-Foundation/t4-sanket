// Crowd Zone Detail Page — Comprehensive Tactical Deep Dive
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getZone,
  getZoneContext,
  setZoneCrowd,
  setRouteStatus,
  getSeries,
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
  StaleDataState,
  DiversionModal,
  LoadingState,
} from "@/components/admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Users,
  TrendingUp,
  Radio,
  Clock,
  ShieldAlert,
  AlertTriangle,
  Compass,
  CheckCircle2,
  Sliders,
  MapPin,
  ExternalLink,
  Navigation,
  Car,
  Utensils,
  Building2,
  Map as MapIcon,
  Flame,
  ArrowRight,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { CrowdLevel } from "@/types";

export const Route = createFileRoute("/admin/crowd/$zoneId")({
  component: CrowdZoneDetailPage,
});

function CrowdZoneDetailPage() {
  const { zoneId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  // State
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [selectedOverrideLevel, setSelectedOverrideLevel] = useState<CrowdLevel>("HIGH");
  const [diversionModalOpen, setDiversionModalOpen] = useState(false);
  const [trendDuration, setTrendDuration] = useState<"30m" | "1h" | "3h">("1h");

  // Queries
  const zoneQuery = useQuery({
    queryKey: ["zone", zoneId],
    queryFn: () => getZone(zoneId),
  });

  const contextQuery = useQuery({
    queryKey: ["zone-context", zoneId],
    queryFn: () => getZoneContext(zoneId),
  });

  const seriesQuery = useQuery({
    queryKey: ["series"],
    queryFn: getSeries,
  });

  // Mutation for status override
  const overrideMutation = useMutation({
    mutationFn: (level: CrowdLevel) => setZoneCrowd(zoneId, level),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["zone", zoneId] });
      qc.invalidateQueries({ queryKey: ["zones"] });
      qc.invalidateQueries({ queryKey: ["zone-context", zoneId] });
      setOverrideModalOpen(false);
      toast.success(`Operational status for ${zoneId} updated to ${selectedOverrideLevel}`);
    },
  });

  const zone = zoneQuery.data;
  const context = contextQuery.data;

  // Pressure calculations
  const pressurePct = zone?.crowd === "PEAK" ? 94 : zone?.crowd === "HIGH" ? 78 : zone?.crowd === "MODERATE" ? 54 : 28;
  const trendDelta = zone?.trend === "INCREASING" ? "+14% in last 30 min" : zone?.trend === "DECREASING" ? "-8% in last 30 min" : "Stable";

  // Filter series based on duration
  const chartData = useMemo(() => {
    if (trendDuration === "30m") {
      return [
        { label: "15:30", value: Math.round(pressurePct * 0.88) },
        { label: "15:40", value: Math.round(pressurePct * 0.92) },
        { label: "15:50", value: Math.round(pressurePct * 0.96) },
        { label: "16:00", value: pressurePct },
      ];
    }
    if (trendDuration === "1h") {
      return [
        { label: "15:00", value: Math.round(pressurePct * 0.78) },
        { label: "15:15", value: Math.round(pressurePct * 0.84) },
        { label: "15:30", value: Math.round(pressurePct * 0.91) },
        { label: "15:45", value: Math.round(pressurePct * 0.97) },
        { label: "16:00", value: pressurePct },
      ];
    }
    return [
      { label: "13:00", value: 42 },
      { label: "13:30", value: 48 },
      { label: "14:00", value: 55 },
      { label: "14:30", value: 63 },
      { label: "15:00", value: 71 },
      { label: "15:30", value: 84 },
      { label: "16:00", value: pressurePct },
    ];
  }, [trendDuration, pressurePct]);

  // Deterministic Assessment Generator
  const operationalAssessment = useMemo(() => {
    if (!zone) return "";
    if (zone.crowd === "PEAK") {
      return `${zone.name} has reached critical peak threshold (${pressurePct}% operational pressure). Connecting route R17 is heavily saturated. Pedestrian inflow must be restricted at upstream holding points immediately, with alternate routing activated via R18 West Loop.`;
    }
    if (zone.crowd === "HIGH") {
      return `${zone.name} is experiencing elevated crowd pressure (+14% over past 30 minutes). Connecting route R17 is currently CONGESTED while alternate corridor R18 remains MODERATE. Recommend directing pedestrian movement toward R18 to prevent stepped bottlenecks.`;
    }
    return `${zone.name} is operating within normal holding parameters (${pressurePct}% pressure). Inflow and outflow rates are balanced. Continuous CCTV and volunteer patrols recommended.`;
  }, [zone, pressurePct]);

  if (zoneQuery.isLoading || contextQuery.isLoading) return <LoadingState />;

  if (!zone) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center space-y-3">
        <h2 className="text-base font-semibold text-foreground">Operational Sector Not Found</h2>
        <p className="text-xs text-muted-foreground">The requested sector ID does not exist in registry.</p>
        <Button variant="outline" size="sm" onClick={() => navigate({ to: "/admin/crowd" })}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Return to Crowd Intelligence
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header with Title & Operational Action Buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-bold font-mono">
              {zone.id}
            </span>
            <h1 className="text-xl font-bold tracking-tight text-foreground font-sans">
              {zone.name}
            </h1>
            <StatusBadge value={zone.crowd} kind="crowd" size="md" />
            <TrendIndicator trend={zone.trend} />
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {zone.area} Sector · High-density operational inspection and intervention controls
          </p>
        </div>

        {/* Working Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View on Map */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: "/admin/crowd" })}
            className="text-xs gap-1.5"
            title="Return to primary GIS map focusing on this sector"
          >
            <MapIcon className="h-3.5 w-3.5 text-primary" />
            <span>View on Map</span>
          </Button>

          {/* Recommend Diversion */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDiversionModalOpen(true)}
            className="text-xs gap-1.5"
            title="Open route diversion workflow"
          >
            <Compass className="h-3.5 w-3.5 text-primary" />
            <span>Recommend Diversion</span>
          </Button>

          {/* Create Alert */}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigate({
                to: "/admin/alerts/create",
                search: { zoneId: zone.id, severity: zone.crowd === "PEAK" ? "CRITICAL" : "WARNING", title: undefined },
              })
            }
            className="text-xs gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20"
            title="Broadcast emergency alert for this sector"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Create Alert</span>
          </Button>

          {/* Override Status */}
          <Button
            size="sm"
            className="text-xs gap-1.5 bg-primary text-primary-foreground font-semibold"
            onClick={() => setOverrideModalOpen(true)}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Override Status</span>
          </Button>
        </div>
      </div>

      {/* Freshness Banner */}
      <StaleDataState
        updatedMinutesAgo={zone.updatedMinutesAgo}
        onRefresh={() => {
          qc.invalidateQueries({ queryKey: ["zone", zoneId] });
          toast.success("Zone telemetry refreshed");
        }}
      />

      {/* LIVE SNAPSHOT KPI STRIP */}
      <MetricStrip>
        <MetricCard
          label="Current Crowd"
          value={<StatusBadge value={zone.crowd} kind="crowd" size="md" />}
          sublabel="Real-time optical + sensor feed"
        />
        <MetricCard
          label="Estimated Pilgrims"
          value={zone.pilgrims.toLocaleString()}
          icon={<Users className="h-4 w-4 text-primary" />}
          sublabel={`${zone.area} boundary count`}
        />
        <MetricCard
          label="Crowd Pressure"
          value={`${pressurePct}%`}
          icon={<TrendingUp className="h-4 w-4 text-amber-500" />}
          sublabel={trendDelta}
          variant={pressurePct > 85 ? "critical" : pressurePct > 70 ? "warning" : "default"}
        />
        <MetricCard
          label="Verified Reports"
          value={`${zone.reports} verified`}
          icon={<Radio className="h-4 w-4 text-emerald-500" />}
          sublabel="Triangulated optical & field log"
        />
        <MetricCard
          label="Confidence"
          value={zone.confidence === "HIGH" ? "94% High" : "78% Med"}
          icon={<CheckCircle2 className="h-4 w-4 text-blue-500" />}
          sublabel="Multi-sensor reliability"
        />
        <MetricCard
          label="Last Updated"
          value={zone.updatedMinutesAgo === 0 ? "24 sec ago" : `${zone.updatedMinutesAgo}m ago`}
          icon={<Clock className="h-4 w-4" />}
          sublabel="Continuous telemetry polling"
        />
      </MetricStrip>

      {/* Main Grid: Focused Map & Charts (Left 68%) + Movement & Operations (Right 32%) */}
      <div className="grid gap-5 lg:grid-cols-12 items-start">
        {/* Left Column (8 cols): Focused Map & Crowd Trend Chart */}
        <div className="lg:col-span-8 space-y-5">
          {/* Focused Dedicated Sector Map */}
          <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Dedicated Sector Perimeter · {zone.name}
              </span>
              <span className="text-[11px] font-mono text-muted-foreground">
                Showing sector boundaries & connected corridors
              </span>
            </div>

            {/* In dedicated crowd page, map focuses only on crowd density and routes by default */}
            <MapPanel
              zones={[zone]}
              selectedId={zone.id}
              focusedZoneId={zone.id}
              routes={(context?.routes ?? []).map((r) => ({
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
              height="380px"
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
                    { color: "#f97316", label: `Sector: ${zone.name}` },
                    { color: "#22c55e", label: "Recommended Routes" },
                    { color: "#f97316", label: "Congested Routes" },
                    { color: "#ef4444", label: "Closed / Diverted" },
                  ]}
                />
              }
            />
          </div>

          {/* CROWD TREND CHART */}
          <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Crowd Density Progression</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Simulated historical density progression against threshold limits
                </p>
              </div>

              {/* Duration Switcher */}
              <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1 text-xs">
                {(["30m", "1h", "3h"] as const).map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => setTrendDuration(dur)}
                    className={`rounded px-2 py-1 font-medium transition-all ${
                      trendDuration === dur
                        ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {dur === "30m" ? "Last 30 min" : dur === "1h" ? "Last 1 hr" : "Last 3 hr"}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="crowdDetailGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c75b12" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#c75b12" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" unit="%" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                    formatter={(val: any) => [`${val}% Pressure`, "Crowd Level"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#c75b12"
                    strokeWidth={2.5}
                    fill="url(#crowdDetailGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Movement Dynamics, Affected Routes & Operations */}
        <div className="lg:col-span-4 space-y-4">
          {/* CROWD MOVEMENT DYNAMICS */}
          <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <Navigation className="h-3.5 w-3.5 text-primary" /> Movement Dynamics
              </span>
              <span className="text-[10px] rounded bg-muted px-1.5 py-0.2 font-mono text-muted-foreground">
                Rate / Hour
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="rounded-lg border border-border/70 bg-muted/20 p-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">
                    Incoming Flow
                  </span>
                  <span className="font-semibold text-foreground">Zone 06 (Sadhugram B)</span>
                </div>
                <span className="font-mono font-bold text-amber-600 text-sm">1,400 / hr ↑</span>
              </div>

              <div className="rounded-lg border border-border/70 bg-muted/20 p-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">
                    Outgoing Flow
                  </span>
                  <span className="font-semibold text-foreground">Zone 08 (Main Snan Ghat)</span>
                </div>
                <span className="font-mono font-bold text-emerald-600 text-sm">950 / hr →</span>
              </div>

              <div className="pt-1 text-[11px] text-muted-foreground space-y-1">
                <div className="flex items-center justify-between">
                  <span>Dominant Direction:</span>
                  <b className="text-foreground">Eastbound (Ghat Steps)</b>
                </div>
                <div className="flex items-center justify-between">
                  <span>Net Accumulation:</span>
                  <b className="text-rose-600 font-mono">+450 / hr surge</b>
                </div>
              </div>
            </div>
          </div>

          {/* AFFECTED ROUTES */}
          <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                Affected Corridors
              </span>
              <span className="text-[10px] text-muted-foreground">Linked Paths</span>
            </div>

            <div className="space-y-2 text-xs">
              {/* R17 */}
              <div className="rounded-lg border border-amber-300 bg-amber-50/40 dark:bg-amber-950/20 p-2.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-amber-700 dark:text-amber-300">R17 · Primary Access</span>
                  <span className="rounded bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 px-1.5 py-0.2 text-[10px] font-bold">
                    CONGESTED
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Kushavarta Feeder → Main Snan Ghat (34 min walk · 2.1 km)
                </p>
              </div>

              {/* R18 (Alternative) */}
              <div className="rounded-lg border border-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/20 p-2.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                    R18 · Recommended Alternative
                  </span>
                  <span className="rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 px-1.5 py-0.2 text-[10px] font-bold">
                    MODERATE
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  West Loop Bypass (39 min walk · 2.5 km)
                </p>
                <div className="pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-[11px] h-7 gap-1 border-emerald-400 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
                    onClick={() => setDiversionModalOpen(true)}
                  >
                    <Compass className="h-3 w-3" /> Activate Diversion to R18
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* NEARBY OPERATIONS (Connected Assets) */}
          <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground block">
              Nearby Operational Infrastructure
            </span>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg border border-border/70 bg-muted/20 p-2">
                <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                  <Car className="h-3 w-3 text-blue-500" /> Parking:
                </span>
                <span className="font-bold text-foreground mt-0.5 block">
                  P04 (78%), P09 (45%)
                </span>
              </div>

              <div className="rounded-lg border border-border/70 bg-muted/20 p-2">
                <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                  <Utensils className="h-3 w-3 text-emerald-500" /> Food:
                </span>
                <span className="font-bold text-foreground mt-0.5 block">
                  K12 (Deficit), K01
                </span>
              </div>

              <div className="rounded-lg border border-border/70 bg-muted/20 p-2">
                <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                  <Building2 className="h-3 w-3 text-purple-500" /> Facilities:
                </span>
                <span className="font-bold text-foreground mt-0.5 block">
                  T08 (3m), T12 (8m)
                </span>
              </div>

              <div className="rounded-lg border border-border/70 bg-muted/20 p-2">
                <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                  <MapPin className="h-3 w-3 text-amber-500" /> Places:
                </span>
                <span className="font-bold text-foreground mt-0.5 block">
                  Ramkund, Kushavarta
                </span>
              </div>
            </div>
          </div>

          {/* DETERMINISTIC OPERATIONAL ASSESSMENT */}
          <div className="rounded-xl border border-amber-300 bg-amber-50/60 dark:bg-amber-950/25 p-4 shadow-xs space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
              <Compass className="h-4 w-4" /> Operational Assessment
            </div>
            <p className="text-xs text-amber-950/90 dark:text-amber-200/90 leading-relaxed font-medium">
              {operationalAssessment}
            </p>
          </div>
        </div>
      </div>

      {/* Override Status Modal */}
      {overrideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs animate-in fade-in"
            onClick={() => setOverrideModalOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl animate-in zoom-in-95">
            <h3 className="text-sm font-semibold text-foreground">Override Sector Operational Crowd Status</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Manually setting the operational crowd level will update digital signage, pilgrim navigation routing, and command dashboards.
            </p>

            <div className="mt-4 space-y-2">
              {(["LOW", "MODERATE", "HIGH", "PEAK"] as CrowdLevel[]).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSelectedOverrideLevel(lvl)}
                  className={`w-full flex items-center justify-between rounded-lg border p-3 text-xs transition-all ${
                    selectedOverrideLevel === lvl
                      ? "border-primary bg-primary/10 font-semibold text-primary"
                      : "border-border hover:bg-muted/40 text-foreground"
                  }`}
                >
                  <StatusBadge value={lvl} kind="crowd" />
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {lvl === "PEAK"
                      ? ">90% (Critical Saturation)"
                      : lvl === "HIGH"
                      ? "70-90% (Surge Warning)"
                      : lvl === "MODERATE"
                      ? "40-70% (Managed Flow)"
                      : "<40% (Normal Flow)"}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setOverrideModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-primary text-primary-foreground font-semibold"
                disabled={overrideMutation.isPending}
                onClick={() => overrideMutation.mutate(selectedOverrideLevel)}
              >
                {overrideMutation.isPending ? "Applying..." : "Confirm Override"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Diversion Action Modal */}
      <DiversionModal
        isOpen={diversionModalOpen}
        onClose={() => setDiversionModalOpen(false)}
        zoneId={zone.id}
        sourceRouteId="R17"
        targetRouteId="R18"
      />
    </div>
  );
}
