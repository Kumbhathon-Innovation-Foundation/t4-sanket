import React from "react";
import { cn } from "@/lib/utils";
import type { ParkingLot, Zone } from "@/types";
import {
  GitCompare,
  TrendingUp,
  Footprints,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Radio,
  Car,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ParkingComparisonCardProps {
  allLots: ParkingLot[];
  zones: Zone[];
  selectedLotIds: string[];
  onToggleLot: (lotId: string) => void;
  onRedirectTraffic?: (fromLotId: string, toLotId: string) => void;
  onInspectLot?: (lotId: string) => void;
}

const LOT_WALK_MAP: Record<
  string,
  { walkingTime: string; corridor: string; corridorStatus: "CLEAR" | "BUSY" | "CONGESTED" }
> = {
  P12: { walkingTime: "13 mins", corridor: "R17 Godavari South Link", corridorStatus: "CONGESTED" },
  P09: { walkingTime: "18 mins", corridor: "R14 Gadge Maharaj Bridge", corridorStatus: "CLEAR" },
  P04: { walkingTime: "15 mins", corridor: "R08 Malegaon Stand Corridor", corridorStatus: "CLEAR" },
  P01: { walkingTime: "24 mins", corridor: "R01 Trimbak Highway Connector", corridorStatus: "CLEAR" },
  P03: { walkingTime: "14 mins", corridor: "R06 Tapovan Approach Road", corridorStatus: "BUSY" },
  P06: { walkingTime: "10 mins", corridor: "R11 Sadhugram Internal Ring", corridorStatus: "BUSY" },
};

export function ParkingComparisonCard({
  allLots,
  zones,
  selectedLotIds,
  onToggleLot,
  onRedirectTraffic,
  onInspectLot,
}: ParkingComparisonCardProps) {
  // Ensure selected lots exist
  const selectedLots = selectedLotIds
    .map((id) => allLots.find((l) => l.id === id))
    .filter((l): l is ParkingLot => Boolean(l));

  // Determine highest occupancy and best alternative for dynamic recommendation
  const sortedByPressure = [...selectedLots].sort(
    (a, b) => b.occupied / b.capacity - a.occupied / a.capacity
  );
  const highestLot = sortedByPressure[0];
  const sortedByAvailable = [...selectedLots].sort(
    (a, b) => b.capacity - b.occupied - (a.capacity - a.occupied)
  );
  const bestAltLot = sortedByAvailable[0];

  const highestPct = highestLot ? Math.round((highestLot.occupied / highestLot.capacity) * 100) : 0;
  const bestAltAvailable = bestAltLot ? Math.max(0, bestAltLot.capacity - bestAltLot.occupied) : 0;
  const bestAltMeta = bestAltLot ? LOT_WALK_MAP[bestAltLot.id] : null;

  const showRecommendation =
    selectedLots.length >= 2 &&
    highestLot &&
    bestAltLot &&
    highestLot.id !== bestAltLot.id &&
    highestPct >= 80;

  return (
    <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs space-y-4">
      {/* Header & Lot Selector Chips */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <GitCompare className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground tracking-tight">
              Multi-Lot Parking Comparison Matrix
            </h3>
            <p className="text-xs text-muted-foreground">
              Select 2 or 3 parking facilities to analyze capacity, pedestrian walking times, and corridor load
            </p>
          </div>
        </div>

        {/* Quick Lot Toggle Badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-muted-foreground mr-1">Compare:</span>
          {allLots.map((lot) => {
            const isSelected = selectedLotIds.includes(lot.id);
            return (
              <button
                key={lot.id}
                type="button"
                onClick={() => onToggleLot(lot.id)}
                className={cn(
                  "rounded px-2 py-0.5 text-xs font-mono font-medium transition-colors border",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                    : "bg-muted/40 hover:bg-muted text-foreground border-border/70"
                )}
              >
                {lot.id}
              </button>
            );
          })}
        </div>
      </div>

      {/* Comparison Grid */}
      {selectedLots.length === 0 ? (
        <div className="text-center py-6 text-xs text-muted-foreground">
          Select at least 2 parking lots from the options above to view side-by-side comparison.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {selectedLots.map((lot) => {
            const occPct = Math.round((lot.occupied / lot.capacity) * 100);
            const avail = Math.max(0, lot.capacity - lot.occupied);
            const zone = zones.find((z) => z.id === lot.zoneId);
            const meta = LOT_WALK_MAP[lot.id] || {
              walkingTime: "15 mins",
              corridor: "Direct Approach Road",
              corridorStatus: occPct > 85 ? ("CONGESTED" as const) : ("CLEAR" as const),
            };

            const isSurge = occPct >= 90;

            return (
              <div
                key={lot.id}
                className={cn(
                  "rounded-xl border p-4 transition-all relative",
                  isSurge
                    ? "border-rose-300 bg-rose-50/20 dark:bg-rose-950/10 dark:border-rose-800/50"
                    : "border-border/80 bg-muted/10 hover:border-border"
                )}
              >
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm bg-muted/60 border border-border/60 px-2 py-0.5 rounded">
                      {lot.id}
                    </span>
                    <div>
                      <h4 className="font-semibold text-xs text-foreground leading-tight">
                        {lot.name}
                      </h4>
                      <span className="text-[10px] text-muted-foreground">
                        Sector {lot.zoneId} ({zone?.name || "Nashik Core"})
                      </span>
                    </div>
                  </div>

                  <span
                    className={cn(
                      "rounded px-2 py-0.5 text-[10px] font-bold uppercase",
                      lot.status === "CLOSED"
                        ? "bg-stone-200 text-stone-700"
                        : occPct >= 90
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                        : occPct >= 70
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                    )}
                  >
                    {lot.status === "CLOSED" ? "CLOSED" : occPct >= 90 ? "NEAR CAPACITY" : occPct >= 70 ? "BUSY" : "AVAILABLE"}
                  </span>
                </div>

                {/* Metrics Table */}
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-[11px]">Occupancy:</span>
                    <span className="font-mono font-bold text-foreground">
                      {occPct}% ({lot.occupied.toLocaleString()} / {lot.capacity.toLocaleString()})
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-[11px]">Available Bays:</span>
                    <span
                      className={cn(
                        "font-mono font-bold",
                        avail <= 250 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600"
                      )}
                    >
                      {avail.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-[11px]">Surrounding Crowd:</span>
                    <span
                      className={cn(
                        "font-semibold text-[11px]",
                        zone?.crowd === "PEAK"
                          ? "text-rose-600"
                          : zone?.crowd === "HIGH"
                          ? "text-amber-600"
                          : "text-emerald-600"
                      )}
                    >
                      {zone?.crowd || "MODERATE"} ({zone?.pilgrims.toLocaleString() || "12,000"} pilgrims)
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-[11px]">Pedestrian Time:</span>
                    <span className="font-mono font-semibold text-foreground flex items-center gap-1">
                      <Footprints className="h-3 w-3 text-muted-foreground" />
                      {meta.walkingTime}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-[11px]">Connecting Corridor:</span>
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.2 text-[10px] font-bold uppercase",
                        meta.corridorStatus === "CONGESTED"
                          ? "bg-rose-100 text-rose-700"
                          : meta.corridorStatus === "BUSY"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                      )}
                    >
                      {meta.corridorStatus}
                    </span>
                  </div>
                </div>

                {onInspectLot && (
                  <div className="mt-3 pt-2 border-t border-border/50">
                    <button
                      type="button"
                      onClick={() => onInspectLot(lot.id)}
                      className="text-[11px] text-primary hover:underline font-medium flex items-center justify-between w-full"
                    >
                      <span>Open in Live Drawer</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Dynamic Operational Recommendation Banner */}
      {showRecommendation && (
        <div className="rounded-xl border border-amber-300 bg-amber-50/80 dark:bg-amber-950/40 dark:border-amber-800/70 p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-amber-600 animate-pulse" />
              <span className="text-xs font-bold text-amber-950 dark:text-amber-200 uppercase tracking-wider">
                Computed Recommendation
              </span>
            </div>
            <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400">
              Live Telemetry Arbitration
            </span>
          </div>

          <p className="text-xs text-amber-950 dark:text-amber-100 leading-relaxed font-medium">
            <strong>{highestLot.id}</strong> is nearing capacity ({highestPct}%) while{" "}
            <strong>{bestAltLot.id}</strong> has significantly more available capacity (
            {bestAltAvailable.toLocaleString()} bays) and a lower-crowd pedestrian connection via{" "}
            {bestAltMeta?.corridor || "connecting bridge"} ({bestAltMeta?.walkingTime || "15 mins"}).
          </p>

          {onRedirectTraffic && (
            <div className="flex justify-end pt-1">
              <Button
                type="button"
                size="sm"
                onClick={() => onRedirectTraffic(highestLot.id, bestAltLot.id)}
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs h-8 gap-1.5 shadow-xs"
              >
                <Radio className="h-3.5 w-3.5" />
                Redirect Traffic to {bestAltLot.id}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
