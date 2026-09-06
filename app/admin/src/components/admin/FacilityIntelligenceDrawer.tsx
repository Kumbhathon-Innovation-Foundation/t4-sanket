import React from "react";
import { cn } from "@/lib/utils";
import type { Facility, Zone, FacilityType } from "@/types";
import {
  X,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Accessibility,
  Wrench,
  ShieldAlert,
  PowerOff,
  Radio,
  Sliders,
  Users,
  Compass,
  HeartPulse,
  Droplets,
  HelpCircle,
  Armchair,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface FacilityIntelligenceDrawerProps {
  facility: Facility | null;
  zone: Zone | null;
  allFacilities?: Facility[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (facility: Facility) => void;
  onUpdateQueue: (facility: Facility) => void;
  onReportIssue: (facility: Facility) => void;
  onCloseFacility: (facility: Facility) => void;
  onReopenFacility: (facility: Facility) => void;
  onViewDetail: (facilityId: string) => void;
  onSelectAlternative?: (facilityId: string) => void;
}

export function getFacilityTypeIcon(type: FacilityType, className = "h-4 w-4") {
  switch (type) {
    case "TOILET":
      return <Accessibility className={className} />;
    case "WATER":
      return <Droplets className={className} />;
    case "MEDICAL":
      return <HeartPulse className={className} />;
    case "HELP":
      return <HelpCircle className={className} />;
    case "REST":
      return <Armchair className={className} />;
    default:
      return <Wrench className={className} />;
  }
}

export function FacilityIntelligenceDrawer({
  facility,
  zone,
  allFacilities = [],
  isOpen,
  onClose,
  onUpdateStatus,
  onUpdateQueue,
  onReportIssue,
  onCloseFacility,
  onReopenFacility,
  onViewDetail,
  onSelectAlternative,
}: FacilityIntelligenceDrawerProps) {
  if (!isOpen || !facility) return null;

  const isClosed = facility.status === "CLOSED";
  const isNeedsAttention = facility.status === "NEEDS_ATTENTION";
  const isLongQueue = !isClosed && (facility.queue === "HIGH" || facility.queue === "PEAK" || facility.waitMinutes >= 8);
  const isBusy = !isClosed && !isLongQueue && (facility.queue === "MODERATE" || facility.waitMinutes >= 4);

  const operationalState: "OPEN" | "BUSY" | "LONG QUEUE" | "OUT OF SERVICE" | "UNKNOWN" = isClosed
    ? "OUT OF SERVICE"
    : isLongQueue
    ? "LONG QUEUE"
    : isBusy
    ? "BUSY"
    : isNeedsAttention
    ? "UNKNOWN"
    : "OPEN";

  const stateBg =
    operationalState === "LONG QUEUE"
      ? "#ef4444"
      : operationalState === "BUSY"
      ? "#f59e0b"
      : operationalState === "OUT OF SERVICE"
      ? "#64748b"
      : operationalState === "UNKNOWN"
      ? "#8b5cf6"
      : "#10b981";

  // Nearby alternative facilities of the same type
  const alternatives = allFacilities
    .filter((f) => f.id !== facility.id && f.type === facility.type && f.status !== "CLOSED")
    .sort((a, b) => a.waitMinutes - b.waitMinutes)
    .slice(0, 3);

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border/90 bg-card/98 shadow-2xl backdrop-blur-xl animate-in slide-in-from-right-full duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/80 px-5 py-4 bg-muted/20">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-mono text-xs font-bold border border-primary/20">
            {facility.id}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-semibold text-foreground tracking-tight">
                {facility.name}
              </h2>
            </div>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <span className="font-semibold uppercase tracking-wider">{facility.type}</span>
              <span>· Sector {facility.zoneId}</span>
              {zone && <span>· {zone.name}</span>}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Close Drawer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
        {/* Status & Freshness Header */}
        <div className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/30 p-3">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1 font-semibold">
              Operational State
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded px-2.5 py-0.5 text-xs font-bold uppercase",
                operationalState === "LONG QUEUE"
                  ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                  : operationalState === "BUSY"
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                  : operationalState === "OUT OF SERVICE"
                  ? "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300"
                  : operationalState === "UNKNOWN"
                  ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
              )}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: stateBg }}
              />
              {operationalState}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1 font-semibold">
              Telemetry Freshness
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <Clock className="h-3 w-3 animate-pulse" />
              Updated {facility.updatedMinutesAgo ? `${facility.updatedMinutesAgo}m ago` : "28s ago"}
            </span>
          </div>
        </div>

        {/* Live Queue & Wait Time Panel */}
        <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <span className="font-semibold text-foreground text-xs uppercase tracking-wider">
              Queue & Service Velocity
            </span>
            <span
              className={cn(
                "text-xs font-bold font-mono px-2 py-0.5 rounded uppercase",
                isLongQueue
                  ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                  : isBusy
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
              )}
            >
              {facility.queue} QUEUE
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted/40 p-2.5 border border-border/50">
              <span className="text-[10px] text-muted-foreground block font-medium">Estimated Wait</span>
              <span
                className={cn(
                  "text-base font-bold font-mono",
                  facility.waitMinutes >= 8
                    ? "text-rose-600 dark:text-rose-400"
                    : facility.waitMinutes >= 4
                    ? "text-amber-600"
                    : "text-emerald-600"
                )}
              >
                ~{facility.waitMinutes} mins
              </span>
            </div>

            <div className="rounded-lg bg-muted/40 p-2.5 border border-border/50">
              <span className="text-[10px] text-muted-foreground block font-medium">Facility Capacity</span>
              <span className="text-base font-bold font-mono text-foreground">
                {facility.capacity} units
              </span>
            </div>

            <div className="rounded-lg bg-muted/40 p-2.5 border border-border/50">
              <span className="text-[10px] text-muted-foreground block font-medium">Accessibility</span>
              <span className="text-xs font-bold text-foreground flex items-center gap-1 mt-1">
                {facility.accessible ? (
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Wheelchair Ramps
                  </span>
                ) : (
                  <span className="text-muted-foreground">Standard Access</span>
                )}
              </span>
            </div>

            <div className="rounded-lg bg-muted/40 p-2.5 border border-border/50">
              <span className="text-[10px] text-muted-foreground block font-medium">Last Inspection</span>
              <span className="text-[11px] font-medium text-foreground truncate block mt-1">
                {facility.lastInspection}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Operations Actions */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
            Facility Operational Overrides
          </span>
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onUpdateQueue(facility)}
              className="text-xs h-8 font-medium gap-1 bg-card hover:bg-muted"
            >
              <Sliders className="h-3.5 w-3.5 text-primary" />
              Update Queue
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onReportIssue(facility)}
              className="text-xs h-8 font-medium gap-1 border-amber-300 text-amber-700 dark:text-amber-300 hover:bg-amber-50"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              Report Issue
            </Button>

            {isClosed ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onReopenFacility(facility)}
                className="text-xs h-8 font-medium gap-1 border-emerald-200 text-emerald-600 hover:bg-emerald-50"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Re-open
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onCloseFacility(facility)}
                className="text-xs h-8 font-medium gap-1 border-stone-300 text-stone-700 dark:text-stone-300 hover:bg-muted"
              >
                <PowerOff className="h-3.5 w-3.5 text-stone-500" />
                Close
              </Button>
            )}
          </div>
        </div>

        {/* Nearby Host Sector Footfall Context */}
        <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground border-b border-border/60 pb-2">
            <Users className="h-4 w-4 text-primary" />
            <span>Surrounding Sector Crowd Density</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-[11px]">Host Sector:</span>
              <span className="font-semibold text-foreground">
                {facility.zoneId} {zone ? `(${zone.name})` : ""}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-[11px]">Ambient Crowd Level:</span>
              <span
                className={cn(
                  "font-bold uppercase text-[11px]",
                  zone?.crowd === "PEAK"
                    ? "text-rose-600"
                    : zone?.crowd === "HIGH"
                    ? "text-amber-600"
                    : "text-emerald-600"
                )}
              >
                {zone?.crowd || "MODERATE"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-[11px]">Sector Pilgrim Count:</span>
              <span className="font-mono font-medium text-foreground">
                {zone ? `${zone.pilgrims.toLocaleString()} pilgrims` : "Nominal"}
              </span>
            </div>
          </div>
        </div>

        {/* Nearby Alternative Facilities */}
        {alternatives.length > 0 && (
          <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Compass className="h-4 w-4 text-primary" />
                <span>Nearby Alternative {facility.type}s</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Lowest Queue Order</span>
            </div>

            <div className="space-y-2">
              {alternatives.map((alt) => (
                <div
                  key={alt.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/50 hover:bg-muted/40 transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-xs text-foreground">
                        {alt.id}
                      </span>
                      <span className="text-[11px] font-medium text-foreground truncate max-w-[130px]">
                        {alt.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground block">
                      Sector {alt.zoneId} · ~{alt.waitMinutes} min wait
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.2 text-[9px] font-bold uppercase",
                        alt.waitMinutes <= 3
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-700"
                      )}
                    >
                      ~{alt.waitMinutes}m
                    </span>
                    {onSelectAlternative && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectAlternative(alt.id)}
                        className="h-6 w-6 p-0"
                        title={`Switch to ${alt.id}`}
                      >
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Deep View */}
        <div className="pt-2 border-t border-border/70">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onViewDetail(facility.id)}
            className="w-full justify-between text-xs text-muted-foreground hover:text-foreground h-9"
          >
            <span>Inspect Deep Telemetry & Service History</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
