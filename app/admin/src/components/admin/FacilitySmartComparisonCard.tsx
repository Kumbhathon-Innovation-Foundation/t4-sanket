import React, { useState } from "react";
import { cn } from "@/lib/utils";
import type { Facility, FacilityType, Zone } from "@/types";
import {
  Compass,
  Clock,
  Footprints,
  Accessibility,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Radio,
  Zap,
  Droplets,
  HeartPulse,
  HelpCircle,
  Armchair,
  Wrench,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface FacilitySmartComparisonCardProps {
  allFacilities: Facility[];
  zones: Zone[];
  onInspectFacility: (facilityId: string) => void;
  onDispatchGuidance?: (fromFacility: Facility, toFacility: Facility) => void;
}

const ANCHOR_SECTORS = [
  { id: "Z08", label: "Ramkund Basin & South (Zone 08)", lat: 19.9985, lng: 73.7915 },
  { id: "Z07", label: "Kushavarta Feeder (Zone 07)", lat: 19.9960, lng: 73.7890 },
  { id: "Z04", label: "Panchavati Core (Zone 04)", lat: 20.0075, lng: 73.7930 },
  { id: "Z06", label: "Sadhugram Concourse (Zone 06)", lat: 20.0010, lng: 73.8040 },
  { id: "Z03", label: "Tapovan Ghats (Zone 03)", lat: 20.0080, lng: 73.8120 },
];

// Distance estimation in meters based on zone proximity
function estimateDistanceMeters(facility: Facility, anchorZoneId: string): number {
  if (facility.zoneId === anchorZoneId) return 140;
  if ((facility.zoneId === "Z08" && anchorZoneId === "Z07") || (facility.zoneId === "Z07" && anchorZoneId === "Z08")) return 220;
  if ((facility.zoneId === "Z08" && anchorZoneId === "Z04") || (facility.zoneId === "Z04" && anchorZoneId === "Z08")) return 450;
  if (facility.zoneId === "Z06") return 680;
  return 890;
}

export function FacilitySmartComparisonCard({
  allFacilities,
  zones,
  onInspectFacility,
  onDispatchGuidance,
}: FacilitySmartComparisonCardProps) {
  const [selectedType, setSelectedType] = useState<FacilityType>("TOILET");
  const [selectedAnchorZone, setSelectedAnchorZone] = useState<string>("Z08");

  // Filter facilities by selected type
  const matchingFacilities = allFacilities.filter((f) => f.type === selectedType);

  // Compute distance and sort by shortest wait time
  const rankedFacilities = matchingFacilities
    .map((f) => ({
      ...f,
      distanceMeters: estimateDistanceMeters(f, selectedAnchorZone),
    }))
    .sort((a, b) => {
      // Prioritize open over closed
      if (a.status === "CLOSED" && b.status !== "CLOSED") return 1;
      if (b.status === "CLOSED" && a.status !== "CLOSED") return -1;
      // Then sort by wait minutes
      if (a.waitMinutes !== b.waitMinutes) return a.waitMinutes - b.waitMinutes;
      // Then by distance
      return a.distanceMeters - b.distanceMeters;
    });

  const bestFacility = rankedFacilities.find((f) => f.status !== "CLOSED") || null;
  const congestedFacility = rankedFacilities.find(
    (f) => f.status !== "CLOSED" && (f.queue === "HIGH" || f.queue === "PEAK" || f.waitMinutes >= 8)
  );

  const facilityTypeLabel =
    selectedType === "TOILET"
      ? "toilet"
      : selectedType === "WATER"
      ? "water point"
      : selectedType === "MEDICAL"
      ? "medical post"
      : selectedType === "HELP"
      ? "help desk"
      : "rest area";

  return (
    <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs space-y-4">
      {/* Header & Type Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Compass className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground tracking-tight">
              Smart Facility Queue Comparison & Pilgrim Guidance
            </h3>
            <p className="text-xs text-muted-foreground">
              Compare nearby service points by queue pressure, wait times, and walking distance
            </p>
          </div>
        </div>

        {/* Type Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1">
          {(
            [
              { type: "TOILET" as const, label: "Toilets", icon: Accessibility },
              { type: "WATER" as const, label: "Water", icon: Droplets },
              { type: "MEDICAL" as const, label: "Medical", icon: HeartPulse },
              { type: "HELP" as const, label: "Help", icon: HelpCircle },
              { type: "REST" as const, label: "Rest", icon: Armchair },
            ] as const
          ).map((t) => {
            const Icon = t.icon;
            const isSelected = selectedType === t.type;
            return (
              <button
                key={t.type}
                type="button"
                onClick={() => setSelectedType(t.type)}
                className={cn(
                  "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors border",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                    : "bg-muted/40 hover:bg-muted text-foreground border-border/70"
                )}
              >
                <Icon className="h-3 w-3" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pilgrim Question Highlight Banner */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Pilgrim Query Resolver
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Reference Location:</span>
            <select
              value={selectedAnchorZone}
              onChange={(e) => setSelectedAnchorZone(e.target.value)}
              className="rounded-md border border-border bg-card px-2 py-0.5 text-xs text-foreground focus:outline-hidden"
            >
              {ANCHOR_SECTORS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-lg bg-card/80 border border-border/70 p-3">
          <span className="text-xs font-bold text-foreground block mb-1">
            "Which nearby {facilityTypeLabel} currently has the shortest queue?"
          </span>
          {bestFacility ? (
            <p className="text-xs text-foreground leading-relaxed">
              <strong>Shortest Queue Answer:</strong> Near{" "}
              {(ANCHOR_SECTORS.find((s) => s.id === selectedAnchorZone)?.label?.split("(")[0] ?? selectedAnchorZone).trim()},{" "}
              <strong>{bestFacility.name} ({bestFacility.id})</strong> currently has the shortest wait with only{" "}
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                ~{bestFacility.waitMinutes} min wait ({bestFacility.queue} QUEUE)
              </span>
              , located ~{bestFacility.distanceMeters}m away.
              {congestedFacility && congestedFacility.id !== bestFacility.id && (
                <span>
                  {" "}Diverting incoming pilgrims from <strong>{congestedFacility.id}</strong> (
                  {congestedFacility.waitMinutes} min wait · {congestedFacility.queue} QUEUE) will save approximately{" "}
                  <strong>{Math.max(1, congestedFacility.waitMinutes - bestFacility.waitMinutes)} minutes</strong> per pilgrim.
                </span>
              )}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              No operational facilities of this type currently reported in this sector.
            </p>
          )}
        </div>

        {bestFacility && congestedFacility && congestedFacility.id !== bestFacility.id && onDispatchGuidance && (
          <div className="flex justify-end pt-1">
            <Button
              type="button"
              size="sm"
              onClick={() => onDispatchGuidance(congestedFacility, bestFacility)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-8 gap-1.5 shadow-xs"
            >
              <Radio className="h-3.5 w-3.5" />
              Guide Pilgrims to {bestFacility.id} (Save ~{congestedFacility.waitMinutes - bestFacility.waitMinutes} mins)
            </Button>
          </div>
        )}
      </div>

      {/* Comparison Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {rankedFacilities.map((facility, index) => {
          const isBest = index === 0 && facility.status !== "CLOSED";
          const isCongested = facility.status !== "CLOSED" && (facility.queue === "HIGH" || facility.queue === "PEAK" || facility.waitMinutes >= 8);

          return (
            <div
              key={facility.id}
              className={cn(
                "rounded-xl border p-3.5 transition-all relative flex flex-col justify-between",
                isBest
                  ? "border-emerald-300 bg-emerald-50/20 dark:bg-emerald-950/10 dark:border-emerald-800/60 ring-1 ring-emerald-500/30"
                  : isCongested
                  ? "border-rose-200 bg-rose-50/20 dark:bg-rose-950/10"
                  : "border-border/80 bg-muted/10 hover:border-border"
              )}
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-muted/60 border border-border/60 px-1.5 py-0.5 rounded">
                      {facility.id}
                    </span>
                    <div>
                      <h4 className="font-semibold text-xs text-foreground leading-tight">
                        {facility.name}
                      </h4>
                      <span className="text-[10px] text-muted-foreground">
                        Sector {facility.zoneId}
                      </span>
                    </div>
                  </div>

                  <span
                    className={cn(
                      "rounded px-1.5 py-0.2 text-[9px] font-bold uppercase",
                      facility.status === "CLOSED"
                        ? "bg-stone-200 text-stone-700"
                        : isCongested
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                        : facility.queue === "MODERATE"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    )}
                  >
                    {facility.status === "CLOSED" ? "OUT OF SERVICE" : isCongested ? "LONG QUEUE" : facility.queue === "MODERATE" ? "BUSY" : "OPEN"}
                  </span>
                </div>

                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-[11px]">Estimated Wait:</span>
                    <span
                      className={cn(
                        "font-mono font-bold",
                        facility.waitMinutes >= 8
                          ? "text-rose-600"
                          : facility.waitMinutes >= 4
                          ? "text-amber-600"
                          : "text-emerald-600"
                      )}
                    >
                      ~{facility.waitMinutes} mins
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-[11px]">Queue Pressure:</span>
                    <span className="font-semibold text-foreground uppercase text-[11px]">
                      {facility.queue}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-[11px]">Estimated Distance:</span>
                    <span className="font-mono font-medium text-foreground flex items-center gap-1">
                      <Footprints className="h-3 w-3 text-muted-foreground" />
                      ~{facility.distanceMeters}m
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-[11px]">Accessibility:</span>
                    <span className="text-[11px]">
                      {facility.accessible ? (
                        <span className="text-emerald-600 font-medium">✓ Accessible</span>
                      ) : (
                        <span className="text-muted-foreground">Standard</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => onInspectFacility(facility.id)}
                  className="text-[11px] text-primary hover:underline font-medium flex items-center gap-1"
                >
                  <span>Inspect Facility</span>
                  <ChevronRight className="h-3 w-3" />
                </button>

                {isBest && (
                  <span className="rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider">
                    Shortest Queue
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
