import React from "react";
import { cn } from "@/lib/utils";
import type { ParkingLot, RouteLink as Route, Zone } from "@/types";
import {
  X,
  Car,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  Navigation,
  Compass,
  Footprints,
  Radio,
  Sliders,
  PowerOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ParkingIntelligenceDrawerProps {
  lot: ParkingLot | null;
  zone: Zone | null;
  routes?: Route[];
  allLots?: ParkingLot[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateOccupancy: (lot: ParkingLot) => void;
  onMarkFull: (lot: ParkingLot) => void;
  onCloseParking: (lot: ParkingLot) => void;
  onReopenParking: (lot: ParkingLot) => void;
  onTriggerAdvisory?: (fromLot: ParkingLot, targetLot: ParkingLot) => void;
  onViewDetail: (parkingId: string) => void;
}

// Destination and corridor metadata mapping
const LOT_JOURNEY_METADATA: Record<
  string,
  {
    destinationGhat: string;
    walkingDistance: string;
    walkingMinutes: number;
    corridorName: string;
    corridorStatus: "CLEAR" | "BUSY" | "CONGESTED";
    routePressure: "Normal" | "Moderate" | "High";
  }
> = {
  P12: {
    destinationGhat: "Snan Ghat / Ramkund South",
    walkingDistance: "0.9 km",
    walkingMinutes: 13,
    corridorName: "R17 Godavari South Link",
    corridorStatus: "CONGESTED",
    routePressure: "High",
  },
  P09: {
    destinationGhat: "Panchavati Core / Ramkund Access",
    walkingDistance: "1.4 km",
    walkingMinutes: 18,
    corridorName: "R14 Gadge Maharaj Bridge",
    corridorStatus: "CLEAR",
    routePressure: "Normal",
  },
  P04: {
    destinationGhat: "Ramkund West / Sita Gufa",
    walkingDistance: "1.2 km",
    walkingMinutes: 15,
    corridorName: "R08 Malegaon Stand Corridor",
    corridorStatus: "CLEAR",
    routePressure: "Normal",
  },
  P01: {
    destinationGhat: "Trimbak Axis / Core Concourse",
    walkingDistance: "1.8 km",
    walkingMinutes: 24,
    corridorName: "R01 Trimbak Highway Connector",
    corridorStatus: "CLEAR",
    routePressure: "Normal",
  },
  P03: {
    destinationGhat: "Tapovan East / Sadhu Gram",
    walkingDistance: "1.1 km",
    walkingMinutes: 14,
    corridorName: "R06 Tapovan Approach Road",
    corridorStatus: "BUSY",
    routePressure: "Moderate",
  },
  P06: {
    destinationGhat: "Sadhugram Concourse",
    walkingDistance: "0.8 km",
    walkingMinutes: 10,
    corridorName: "R11 Sadhugram Internal Ring",
    corridorStatus: "BUSY",
    routePressure: "Moderate",
  },
};

export function ParkingIntelligenceDrawer({
  lot,
  zone,
  routes = [],
  allLots = [],
  isOpen,
  onClose,
  onUpdateOccupancy,
  onMarkFull,
  onCloseParking,
  onReopenParking,
  onTriggerAdvisory,
  onViewDetail,
}: ParkingIntelligenceDrawerProps) {
  if (!isOpen || !lot) return null;

  const occupancyPct = Math.round((lot.occupied / lot.capacity) * 100);
  const availableBays = Math.max(0, lot.capacity - lot.occupied);
  const isClosed = lot.status === "CLOSED";
  const isFull = !isClosed && lot.occupied >= lot.capacity;
  const isNearCapacity = !isClosed && !isFull && occupancyPct >= 90;
  const isBusy = !isClosed && !isFull && !isNearCapacity && occupancyPct >= 70;

  const statusLabel = isClosed
    ? "CLOSED"
    : isFull
    ? "FULL"
    : isNearCapacity
    ? "NEAR CAPACITY"
    : isBusy
    ? "BUSY"
    : "AVAILABLE";

  const journeyMeta = LOT_JOURNEY_METADATA[lot.id] || {
    destinationGhat: zone ? `${zone.name} Ghats` : "Ramkund Concourse",
    walkingDistance: "1.3 km",
    walkingMinutes: 16,
    corridorName: "Connecting Pedestrian Corridor",
    corridorStatus: occupancyPct > 85 ? ("CONGESTED" as const) : ("CLEAR" as const),
    routePressure: occupancyPct > 85 ? ("High" as const) : ("Normal" as const),
  };

  // Find optimal alternative lot (e.g. P09 or lowest occupancy lot)
  const candidateLots = allLots.filter(
    (l) => l.id !== lot.id && l.status !== "CLOSED" && l.occupied / l.capacity < 0.7
  );
  const recommendedLot =
    candidateLots.find((l) => l.id === "P09") ||
    candidateLots.sort((a, b) => a.occupied / a.capacity - b.occupied / b.capacity)[0] ||
    null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border/90 bg-card/98 shadow-2xl backdrop-blur-xl animate-in slide-in-from-right-full duration-200">
      {/* Drawer Header */}
      <div className="flex items-center justify-between border-b border-border/80 px-5 py-4 bg-muted/20">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-mono text-xs font-bold border border-primary/20">
            {lot.id}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground tracking-tight">
              {lot.name}
            </h2>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <span>Sector {lot.zoneId}</span>
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
              Operational Status
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded px-2.5 py-0.5 text-xs font-bold uppercase",
                statusLabel === "FULL"
                  ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                  : statusLabel === "NEAR CAPACITY"
                  ? "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300"
                  : statusLabel === "BUSY"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                  : statusLabel === "CLOSED"
                  ? "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300"
                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
              )}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  backgroundColor:
                    statusLabel === "FULL"
                      ? "#ef4444"
                      : statusLabel === "NEAR CAPACITY"
                      ? "#f97316"
                      : statusLabel === "BUSY"
                      ? "#3b82f6"
                      : statusLabel === "CLOSED"
                      ? "#64748b"
                      : "#10b981",
                }}
              />
              {statusLabel}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1 font-semibold">
              Telemetry Freshness
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <Clock className="h-3 w-3 animate-pulse" />
              Updated 21 sec ago
            </span>
          </div>
        </div>

        {/* Live Parking Panel Metrics (Capacity, Occupied, Available, Occupancy, Trend) */}
        <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <span className="font-semibold text-foreground text-xs uppercase tracking-wider">
              Live Bay Telemetry
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
              <TrendingUp className="h-3.5 w-3.5" />
              Trend: ↑ Increasing
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted/40 p-2.5 border border-border/50">
              <span className="text-[10px] text-muted-foreground block font-medium">Total Capacity</span>
              <span className="text-base font-bold font-mono text-foreground">
                {lot.capacity.toLocaleString()}
              </span>
            </div>

            <div className="rounded-lg bg-muted/40 p-2.5 border border-border/50">
              <span className="text-[10px] text-muted-foreground block font-medium">Occupied Vehicles</span>
              <span className="text-base font-bold font-mono text-foreground">
                {lot.occupied.toLocaleString()}
              </span>
            </div>

            <div
              className={cn(
                "rounded-lg p-2.5 border",
                availableBays <= 250
                  ? "bg-rose-50/50 border-rose-200 dark:bg-rose-950/20"
                  : "bg-muted/40 border-border/50"
              )}
            >
              <span className="text-[10px] text-muted-foreground block font-medium">Available Bays</span>
              <span
                className={cn(
                  "text-base font-bold font-mono",
                  availableBays <= 250 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600"
                )}
              >
                {availableBays.toLocaleString()}
              </span>
            </div>

            <div className="rounded-lg bg-muted/40 p-2.5 border border-border/50">
              <span className="text-[10px] text-muted-foreground block font-medium">Occupancy Rate</span>
              <span
                className={cn(
                  "text-base font-bold font-mono",
                  occupancyPct >= 90
                    ? "text-rose-600"
                    : occupancyPct >= 70
                    ? "text-amber-600"
                    : "text-emerald-600"
                )}
              >
                {occupancyPct}%
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-[11px] mb-1 font-mono text-muted-foreground">
              <span>Bays Filled</span>
              <span>{occupancyPct}% full</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-300",
                  occupancyPct >= 95
                    ? "bg-rose-500"
                    : occupancyPct >= 85
                    ? "bg-orange-500"
                    : occupancyPct >= 70
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                )}
                style={{ width: `${Math.min(100, occupancyPct)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quick Operations Actions */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
            Parking Lot Controls
          </span>
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onUpdateOccupancy(lot)}
              className="text-xs h-8 font-medium gap-1 bg-card hover:bg-muted"
            >
              <Sliders className="h-3.5 w-3.5 text-primary" />
              Update
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onMarkFull(lot)}
              disabled={isFull || isClosed}
              className="text-xs h-8 font-medium gap-1 border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            >
              <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />
              Mark Full
            </Button>

            {isClosed ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onReopenParking(lot)}
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
                onClick={() => onCloseParking(lot)}
                className="text-xs h-8 font-medium gap-1 border-stone-300 text-stone-700 dark:text-stone-300 hover:bg-muted"
              >
                <PowerOff className="h-3.5 w-3.5 text-stone-500" />
                Close
              </Button>
            )}
          </div>
        </div>

        {/* Journey Impact Section */}
        <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground border-b border-border/60 pb-2">
            <Footprints className="h-4 w-4 text-primary" />
            <span>Pedestrian Journey Impact</span>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-[11px]">Primary Destination:</span>
              <span className="font-semibold text-foreground">{journeyMeta.destinationGhat}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-[11px]">Walking Distance:</span>
              <span className="font-mono font-medium text-foreground">{journeyMeta.walkingDistance}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-[11px]">Walking Time:</span>
              <span className="font-mono font-bold text-foreground">
                {journeyMeta.walkingMinutes} mins
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-[11px]">Walking Corridor:</span>
              <span className="font-medium text-foreground">{journeyMeta.corridorName}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-[11px]">Corridor Status:</span>
              <span
                className={cn(
                  "rounded px-2 py-0.5 text-[10px] font-bold uppercase",
                  journeyMeta.corridorStatus === "CONGESTED"
                    ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                    : journeyMeta.corridorStatus === "BUSY"
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                )}
              >
                {journeyMeta.corridorStatus}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-[11px]">Current Route Pressure:</span>
              <span
                className={cn(
                  "font-semibold",
                  journeyMeta.routePressure === "High" ? "text-rose-600" : "text-foreground"
                )}
              >
                {journeyMeta.routePressure}
              </span>
            </div>
          </div>
        </div>

        {/* Recommendation Engine / Route Advisory */}
        {occupancyPct >= 85 && recommendedLot && (
          <div className="rounded-xl border border-amber-300 bg-amber-50/70 dark:bg-amber-950/30 dark:border-amber-700/60 p-4 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
              <Radio className="h-4 w-4 text-amber-600 animate-pulse" />
              <span>RECOMMENDATION ENGINE</span>
            </div>

            <p className="text-xs text-amber-950 dark:text-amber-200 leading-relaxed">
              <strong>{lot.id}</strong> is nearing saturation ({occupancyPct}%). Direct incoming vehicles to{" "}
              <strong>Parking {recommendedLot.id}</strong> ({recommendedLot.name}). Walking corridor via{" "}
              {LOT_JOURNEY_METADATA[recommendedLot.id]?.corridorName || "connecting bridge"} is{" "}
              <span className="font-bold text-emerald-700 dark:text-emerald-400">Clear</span> (
              {LOT_JOURNEY_METADATA[recommendedLot.id]?.walkingMinutes || 12} min walk).
            </p>

            {onTriggerAdvisory && (
              <Button
                type="button"
                size="sm"
                onClick={() => onTriggerAdvisory(lot, recommendedLot)}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs h-8 gap-1.5 shadow-xs"
              >
                <Radio className="h-3.5 w-3.5" />
                Trigger Route Diversion Advisory
              </Button>
            )}
          </div>
        )}

        {/* Footer Deep View */}
        <div className="pt-2 border-t border-border/70">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onViewDetail(lot.id)}
            className="w-full justify-between text-xs text-muted-foreground hover:text-foreground h-9"
          >
            <span>Inspect Deep Telemetry & Time Analysis</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
