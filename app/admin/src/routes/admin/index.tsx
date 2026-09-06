// Operations Overview — Main Control Room Dashboard
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  getDashboardStats,
  getCrowdZones,
  getKitchens,
  getParking,
  getFacilities,
  getRoutes,
  getActivity,
  getAlerts,
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
  ActivityFeed,
  LoadingState,
} from "@/components/admin";
import {
  Users,
  AlertTriangle,
  Utensils,
  Car,
  UserCheck,
  Clock,
  ShieldAlert,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/")({
  component: OperationsOverviewPage,
});

function OperationsOverviewPage() {
  const navigate = useNavigate();

  // Queries using existing service layer
  const statsQuery = useQuery({ queryKey: ["dashboard-stats"], queryFn: getDashboardStats });
  const zonesQuery = useQuery({ queryKey: ["zones"], queryFn: getCrowdZones });
  const kitchensQuery = useQuery({ queryKey: ["kitchens"], queryFn: getKitchens });
  const parkingQuery = useQuery({ queryKey: ["parking"], queryFn: getParking });
  const facilitiesQuery = useQuery({ queryKey: ["facilities"], queryFn: getFacilities });
  const routesQuery = useQuery({ queryKey: ["routes"], queryFn: getRoutes });
  const activityQuery = useQuery({ queryKey: ["activity"], queryFn: getActivity });
  const alertsQuery = useQuery({ queryKey: ["alerts"], queryFn: getAlerts });

  if (statsQuery.isLoading) return <LoadingState />;

  const stats = statsQuery.data;
  const zones = zonesQuery.data ?? [];
  const kitchens = kitchensQuery.data ?? [];
  const parkingLots = parkingQuery.data ?? [];
  const facilities = facilitiesQuery.data ?? [];
  const routes = routesQuery.data ?? [];
  const activities = activityQuery.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations Overview"
        subtitle="Real-time operational overview of the Kumbh environment"
      />

      {/* Top KPI Metrics Strip */}
      <MetricStrip>
        <MetricCard
          label="Active Pilgrims"
          value={stats?.activePilgrims?.toLocaleString() ?? "—"}
          icon={<Users className="h-4 w-4" />}
          trend="up"
          trendLabel="+8% this hour"
        />
        <MetricCard
          label="High / Peak Zones"
          value={stats?.peakZones ?? 0}
          icon={<AlertTriangle className="h-4 w-4" />}
          variant={stats && stats.peakZones > 2 ? "critical" : stats && stats.peakZones > 0 ? "warning" : "default"}
          sublabel="Immediate attention"
        />
        <MetricCard
          label="Food Alerts"
          value={stats?.foodAlerts ?? 0}
          icon={<Utensils className="h-4 w-4" />}
          variant={stats && stats.foodAlerts > 5 ? "warning" : "default"}
          sublabel="Kitchen deficits active"
        />
        <MetricCard
          label="Parking Occupancy"
          value={`${stats?.parkingOccupancy ?? 0}%`}
          icon={<Car className="h-4 w-4" />}
          variant={stats && stats.parkingOccupancy > 85 ? "warning" : "default"}
          sublabel="Outer holding active"
        />
        <MetricCard
          label="Active Volunteers"
          value={stats?.activeVolunteers ?? 0}
          icon={<UserCheck className="h-4 w-4" />}
          sublabel="On duty in field"
        />
        <MetricCard
          label="Stale Reports"
          value={stats?.staleReports ?? 0}
          icon={<Clock className="h-4 w-4" />}
          variant={stats && stats.staleReports > 5 ? "warning" : "default"}
          sublabel="> 5m without telemetry"
        />
      </MetricStrip>

      {/* Main Operational Workspace: Map (Left) + Critical Operations (Right) */}
      <div className="grid gap-5 lg:grid-cols-12 items-start">
        {/* Left / Large Area: Interactive Map */}
        <div className="lg:col-span-8 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Godavari Basin Operational Sector Map
            </span>
            <span className="text-[11px] text-muted-foreground">
              Real-time Sensor & IoT Stream
            </span>
          </div>

          <MapPanel
            zones={zones}
            routes={routes.map((r) => ({
              path: r.path,
              color: r.status === "RECOMMENDED" ? "#22c55e" : r.status === "CONGESTED" ? "#f97316" : r.status === "CLOSED" ? "#ef4444" : "#eab308",
              dashed: r.status === "CLOSED" || r.status === "DIVERSION",
              name: r.name,
            }))}
            markers={[
              ...kitchens.map((k) => ({
                id: k.id,
                point: k.point,
                label: k.name.split(" ")[0],
                color: k.status === "CRITICAL" ? "#ef4444" : k.status === "WARNING" ? "#f97316" : "#22c55e",
                category: "food" as const,
                size: "sm" as const,
              })),
              ...parkingLots.map((p) => ({
                id: p.id,
                point: p.point,
                label: p.id,
                color: p.status === "FULL" ? "#ef4444" : "#2563eb",
                category: "parking" as const,
                size: "sm" as const,
              })),
            ]}
            height="440px"
            onZoneClick={(zoneId) => navigate({ to: "/admin/crowd/$zoneId", params: { zoneId } })}
            legend={
              <MapLegend
                items={[
                  { color: "#22c55e", label: "Low / Stable" },
                  { color: "#eab308", label: "Moderate" },
                  { color: "#f97316", label: "High Crowd" },
                  { color: "#ef4444", label: "Peak / Critical" },
                  { color: "#2563eb", label: "Parking" },
                ]}
              />
            }
          />
        </div>

        {/* Right: Critical Operations Panel */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-rose-600" />
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Critical Operations
              </span>
            </div>
            <span className="rounded-full bg-rose-100 dark:bg-rose-950 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-300">
              4 Requiring Attention
            </span>
          </div>

          <div className="space-y-2.5">
            {/* Zone 07 Card */}
            <div
              onClick={() => navigate({ to: "/admin/crowd/$zoneId", params: { zoneId: "Z07" } })}
              className="cursor-pointer rounded-xl border border-rose-200/80 bg-card p-3.5 shadow-2xs hover:border-rose-300 hover:shadow-xs transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">Zone 07 · Ram Kund</span>
                    <SeverityBadge severity="HIGH" label="HIGH CROWD" size="sm" />
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Ghat entry density at 88% capacity. Inflow queue accumulating at North Steps.
                  </p>
                </div>
                <TrendIndicator trend="INCREASING" />
              </div>
              <div className="mt-2.5 flex items-center justify-between border-t border-border/50 pt-2 text-[11px] text-muted-foreground">
                <span>Sensor: 48,200 pilgrims</span>
                <span className="text-primary font-medium flex items-center gap-0.5">
                  Inspect zone <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>

            {/* Kitchen K12 Card */}
            <div
              onClick={() => navigate({ to: "/admin/food" })}
              className="cursor-pointer rounded-xl border border-amber-200/80 bg-card p-3.5 shadow-2xs hover:border-amber-300 hover:shadow-xs transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">Kitchen K12 · Annakshetra</span>
                    <SeverityBadge severity="CRITICAL" label="FOOD SHORTAGE" size="sm" />
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Estimated demand exceeds current stock. <strong>860 meals deficit</strong> projected.
                  </p>
                </div>
                <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700 border border-rose-200">
                  Deficit
                </span>
              </div>
              <div className="mt-2.5 flex items-center justify-between border-t border-border/50 pt-2 text-[11px] text-muted-foreground">
                <span>Tapovan Sadhu Gram sector</span>
                <span className="text-primary font-medium flex items-center gap-0.5">
                  Dispatch stock <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>

            {/* Parking P12 Card */}
            <div
              onClick={() => navigate({ to: "/admin/parking" })}
              className="cursor-pointer rounded-xl border border-amber-200/80 bg-card p-3.5 shadow-2xs hover:border-amber-300 hover:shadow-xs transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">Parking P12 · Trimbak Link</span>
                    <SeverityBadge severity="HIGH" label="NEAR CAPACITY" size="sm" />
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    1,152 of 1,200 spaces filled. Inbound vehicles diverting to Outer Lot P14.
                  </p>
                </div>
                <span className="text-xs font-bold text-amber-600 font-mono">96%</span>
              </div>
              <div className="mt-2.5 flex items-center justify-between border-t border-border/50 pt-2 text-[11px] text-muted-foreground">
                <span>48 slots remaining</span>
                <span className="text-primary font-medium flex items-center gap-0.5">
                  View diversion <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>

            {/* Facility T12 Card */}
            <div
              onClick={() => navigate({ to: "/admin/facilities" })}
              className="cursor-pointer rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs hover:border-border hover:shadow-xs transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">Facility T12 · Sanitation Block</span>
                    <SeverityBadge severity="WARNING" label="HIGH QUEUE" size="sm" />
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Queue depth exceeds target threshold. Wait time averaging <strong>8 min</strong>.
                  </p>
                </div>
                <span className="text-xs font-mono font-medium text-muted-foreground">8 min wait</span>
              </div>
              <div className="mt-2.5 flex items-center justify-between border-t border-border/50 pt-2 text-[11px] text-muted-foreground">
                <span>Kapila Sangam West</span>
                <span className="text-primary font-medium flex items-center gap-0.5">
                  Sanitation dispatch <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Zone Summary Table */}
      <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold text-foreground tracking-tight uppercase text-muted-foreground">
              Zone Operational Summary
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Live sector health across Crowd, Food, Parking, and Public Facilities
            </p>
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            {zones.length} Managed Sectors
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead className="border-b border-border/70 bg-muted/20 text-muted-foreground select-none">
              <tr>
                <th className="px-3.5 py-2.5 font-semibold">Zone</th>
                <th className="px-3.5 py-2.5 font-semibold">Crowd</th>
                <th className="px-3.5 py-2.5 font-semibold">Trend</th>
                <th className="px-3.5 py-2.5 font-semibold">Food</th>
                <th className="px-3.5 py-2.5 font-semibold">Parking</th>
                <th className="px-3.5 py-2.5 font-semibold">Facilities</th>
                <th className="px-3.5 py-2.5 font-semibold">Updated</th>
                <th className="px-3.5 py-2.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {zones.map((zone) => {
                const zoneKitchens = kitchens.filter((k) => k.zoneId === zone.id);
                const zoneParking = parkingLots.filter((p) => p.zoneId === zone.id);
                const zoneFacilities = facilities.filter((f) => f.zoneId === zone.id);

                const hasFoodDeficit = zoneKitchens.some((k) => k.status === "CRITICAL" || k.status === "WARNING");
                const hasParkingFull = zoneParking.some((p) => p.status === "FULL" || (p.occupied / p.capacity) > 0.9);

                return (
                  <tr
                    key={zone.id}
                    onClick={() => navigate({ to: "/admin/crowd/$zoneId", params: { zoneId: zone.id } })}
                    className="hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <td className="px-3.5 py-2.5 font-semibold text-foreground">
                      <div>{zone.name}</div>
                      <div className="text-[10px] font-mono text-muted-foreground font-normal">{zone.id}</div>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <StatusBadge value={zone.crowd} kind="crowd" />
                    </td>
                    <td className="px-3.5 py-2.5">
                      <TrendIndicator trend={zone.trend} />
                    </td>
                    <td className="px-3.5 py-2.5">
                      <span className={hasFoodDeficit ? "font-semibold text-amber-600" : "text-muted-foreground"}>
                        {hasFoodDeficit ? "Deficit Alert" : "Supply Stable"}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <span className={hasParkingFull ? "font-semibold text-rose-600" : "text-muted-foreground"}>
                        {hasParkingFull ? "Near Full" : "Available"}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 text-muted-foreground">
                      {zoneFacilities.length > 0 ? `${zoneFacilities.length} operational` : "Monitored"}
                    </td>
                    <td className="px-3.5 py-2.5 text-muted-foreground whitespace-nowrap font-mono text-[11px]">
                      {zone.updatedMinutesAgo === 0 ? "Just now" : `${zone.updatedMinutesAgo}m ago`}
                    </td>
                    <td className="px-3.5 py-2.5">
                      <SeverityBadge
                        severity={zone.crowd === "PEAK" ? "CRITICAL" : zone.crowd === "HIGH" ? "HIGH" : zone.crowd === "MODERATE" ? "WARNING" : "NORMAL"}
                        size="sm"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Operational Activity */}
      <ActivityFeed entries={activities} limit={8} />
    </div>
  );
}
