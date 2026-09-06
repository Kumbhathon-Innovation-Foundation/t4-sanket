import React from "react";
import { cn } from "@/lib/utils";
import type { Zone, RouteLink, Facility, Kitchen } from "@/types";
import { StatusBadge } from "./StatusBadge";
import { TrendIndicator } from "./TrendIndicator";
import {
  X,
  Users,
  Radio,
  Clock,
  ShieldAlert,
  ArrowRight,
  Compass,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Activity,
  Utensils,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ZoneIntelligenceDrawerProps {
  zone: Zone | null;
  routes?: RouteLink[];
  facilities?: Facility[];
  kitchens?: Kitchen[];
  isOpen: boolean;
  onClose: () => void;
  onViewZone: (zoneId: string) => void;
  onCreateAlert: (zoneId: string) => void;
  onRecommendDiversion: (zoneId: string) => void;
}

export function ZoneIntelligenceDrawer({
  zone,
  routes = [],
  facilities = [],
  kitchens = [],
  isOpen,
  onClose,
  onViewZone,
  onCreateAlert,
  onRecommendDiversion,
}: ZoneIntelligenceDrawerProps) {
  if (!isOpen || !zone) return null;

  // Calculate pressure percentage & trend delta
  const pressurePct =
    zone.crowd === "PEAK" ? 94 : zone.crowd === "HIGH" ? 78 : zone.crowd === "MODERATE" ? 54 : 28;
  const trendDelta =
    zone.trend === "INCREASING" ? "+14% in last 30 min" : zone.trend === "DECREASING" ? "-8% in last 30 min" : "Stable over last 30 min";

  // Identify affected routes connected to this zone
  const affectedRoutes = routes.filter(
    (r) =>
      r.from.toLowerCase().includes(zone.area.toLowerCase()) ||
      r.to.toLowerCase().includes(zone.area.toLowerCase()) ||
      r.status === "CONGESTED" ||
      r.status === "CLOSED" ||
      r.status === "DIVERSION"
  ).slice(0, 3);

  // Nearby facilities
  const nearbyFacilities = facilities.filter((f) => f.zoneId === zone.id).slice(0, 3);
  // Nearby kitchens
  const nearbyKitchens = kitchens.filter((k) => k.zoneId === zone.id).slice(0, 2);

  // Deterministic recommendation
  const recommendation =
    zone.crowd === "PEAK"
      ? `Critical saturation at ${zone.name}. Inflow on corridor R17 exceeds safe discharge capacity. Immediately halt incoming pedestrian gates and broadcast emergency diversion to R18.`
      : zone.crowd === "HIGH"
      ? `Elevated surge detected in ${zone.name}. Traffic along connecting route R17 is heavily congested while R18 remains moderate. Consider directing pedestrian movement toward R18.`
      : `Flow conditions across ${zone.name} are currently manageable. Maintain continuous CCTV and volunteer monitoring.`;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border/90 bg-card/98 shadow-2xl backdrop-blur-xl animate-in slide-in-from-right-full duration-200">
      {/* Drawer Header */}
      <div className="flex items-center justify-between border-b border-border/80 px-5 py-4 bg-muted/20">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-bold font-mono">
            {zone.id}
          </span>
          <div>
            <h2 className="text-sm font-semibold text-foreground tracking-tight">
              {zone.name}
            </h2>
            <p className="text-[11px] text-muted-foreground">{zone.area}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Close Intelligence Drawer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Drawer Content Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
        {/* Status & Trend Badges */}
        <div className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/30 p-3">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1 font-semibold">
              Current Crowd
            </span>
            <StatusBadge value={zone.crowd} kind="crowd" size="md" />
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1 font-semibold">
              Flow Trend
            </span>
            <TrendIndicator trend={zone.trend} />
          </div>
        </div>

        {/* Live Snapshot Metrics */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-lg border border-border/70 bg-card p-2.5">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
              <Users className="h-3 w-3 text-primary" /> Estimated Pilgrims
            </span>
            <p className="mt-1 text-sm font-bold text-foreground font-mono">
              {zone.pilgrims.toLocaleString()}
            </p>
          </div>

          <div className="rounded-lg border border-border/70 bg-card p-2.5">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
              <Radio className="h-3 w-3 text-emerald-500" /> Verified Reports
            </span>
            <p className="mt-1 text-sm font-bold text-foreground font-mono">
              {zone.reports} verified
            </p>
          </div>

          <div className="rounded-lg border border-border/70 bg-card p-2.5">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
              <Activity className="h-3 w-3 text-blue-500" /> Confidence
            </span>
            <p className="mt-1 text-sm font-bold text-foreground font-mono">
              {zone.confidence === "HIGH" ? "High (94%)" : "Medium (76%)"}
            </p>
          </div>

          <div className="rounded-lg border border-border/70 bg-card p-2.5">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
              <Clock className="h-3 w-3 text-amber-500" /> Last Updated
            </span>
            <p className="mt-1 text-sm font-bold text-foreground font-mono">
              {zone.updatedMinutesAgo === 0 ? "34 sec ago" : `${zone.updatedMinutesAgo}m ago`}
            </p>
          </div>
        </div>

        {/* Crowd Pressure Section */}
        <div className="rounded-lg border border-border/80 bg-card p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-primary" /> Crowd Pressure
            </span>
            <span
              className={cn(
                "font-mono font-bold text-xs",
                pressurePct > 85 ? "text-rose-600" : pressurePct > 70 ? "text-amber-600" : "text-emerald-600"
              )}
            >
              {pressurePct}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full transition-all duration-500",
                pressurePct > 85 ? "bg-rose-500" : pressurePct > 70 ? "bg-amber-500" : "bg-emerald-500"
              )}
              style={{ width: `${pressurePct}%` }}
            />
          </div>

          <p className="text-[11px] text-muted-foreground flex items-center justify-between">
            <span>Trend Delta:</span>
            <span className="font-semibold text-foreground">{trendDelta}</span>
          </p>
        </div>

        {/* Operational Impact Section */}
        <div className="rounded-lg border border-border/80 bg-card p-3.5 space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
            Operational Impact
          </span>

          {/* Affected Routes */}
          <div>
            <span className="text-[11px] font-medium text-foreground block mb-1.5">
              Connecting Corridors:
            </span>
            <div className="space-y-1.5">
              {affectedRoutes.length > 0 ? (
                affectedRoutes.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded border border-border/60 bg-muted/20 px-2.5 py-1.5 text-[11px]"
                  >
                    <span className="font-semibold font-mono">{r.id}</span>
                    <span className="text-muted-foreground truncate max-w-[140px]">
                      {r.from} → {r.to}
                    </span>
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.2 font-semibold text-[10px]",
                        r.status === "CONGESTED"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                          : r.status === "CLOSED"
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                      )}
                    >
                      {r.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-[11px] text-muted-foreground italic">No congested corridors linked</p>
              )}
            </div>
          </div>

          {/* Nearby Assets */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/50 text-[11px]">
            <div>
              <span className="text-muted-foreground flex items-center gap-1 mb-1">
                <Building2 className="h-3 w-3" /> Facilities:
              </span>
              <div className="space-y-0.5">
                {nearbyFacilities.length > 0 ? (
                  nearbyFacilities.map((f) => (
                    <span key={f.id} className="block font-mono text-[10px]">
                      {f.id} ({f.waitMinutes}m wait)
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-muted-foreground">T08, T12 nearby</span>
                )}
              </div>
            </div>

            <div>
              <span className="text-muted-foreground flex items-center gap-1 mb-1">
                <Utensils className="h-3 w-3" /> Kitchens:
              </span>
              <div className="space-y-0.5">
                {nearbyKitchens.length > 0 ? (
                  nearbyKitchens.map((k) => (
                    <span key={k.id} className="block font-mono text-[10px]">
                      {k.id} ({k.status})
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-muted-foreground">K12 (Deficit)</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Action Card */}
        <div className="rounded-lg border border-amber-300/80 bg-amber-50/60 dark:bg-amber-950/20 p-3.5 space-y-2">
          <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-300 font-semibold text-xs">
            <Compass className="h-4 w-4" /> Recommended Tactical Action
          </div>
          <p className="text-xs text-amber-950/90 dark:text-amber-200/90 leading-relaxed">
            {recommendation}
          </p>
        </div>
      </div>

      {/* Action Command Footer */}
      <div className="border-t border-border/80 bg-card p-4 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="outline"
            className="w-full gap-1 text-xs"
            onClick={() => onRecommendDiversion(zone.id)}
          >
            <Compass className="h-3.5 w-3.5 text-primary" /> Recommend Diversion
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="w-full gap-1 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20"
            onClick={() => onCreateAlert(zone.id)}
          >
            <ShieldAlert className="h-3.5 w-3.5" /> Create Alert
          </Button>
        </div>

        <Button
          size="sm"
          className="w-full gap-1.5 text-xs bg-primary text-primary-foreground font-semibold"
          onClick={() => onViewZone(zone.id)}
        >
          <span>View Dedicated Zone Intelligence</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
