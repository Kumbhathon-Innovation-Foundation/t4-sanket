import React from "react";
import { cn } from "@/lib/utils";
import type { Kitchen, Shortage, Zone } from "@/types";
import { StatusBadge } from "./StatusBadge";
import {
  X,
  Utensils,
  Clock,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Package,
  CheckCircle2,
  Users,
  Building2,
  ExternalLink,
  PowerOff,
  Heart,
  Phone,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface KitchenIntelligenceDrawerProps {
  kitchen: Kitchen | null;
  zone: Zone | null;
  shortages?: Shortage[];
  nearbyKitchens?: Kitchen[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateStock: (kitchen: Kitchen) => void;
  onVerifyShortage: (shortageId: string) => void;
  onCreateAlert: (kitchen: Kitchen, zone: Zone | null) => void;
  onCloseKitchen: (kitchen: Kitchen) => void;
  onViewDetail: (kitchenId: string) => void;
  onDonate?: (shortage: Shortage, kitchen: Kitchen) => void;
}

export function KitchenIntelligenceDrawer({
  kitchen,
  zone,
  shortages = [],
  nearbyKitchens = [],
  isOpen,
  onClose,
  onUpdateStock,
  onVerifyShortage,
  onCreateAlert,
  onCloseKitchen,
  onViewDetail,
  onDonate,
}: KitchenIntelligenceDrawerProps) {
  if (!isOpen || !kitchen) return null;

  const deficit = Math.max(0, kitchen.estimatedDemand - kitchen.mealsAvailable);
  const supplyRatio = Math.min(100, Math.round((kitchen.mealsAvailable / kitchen.estimatedDemand) * 100));
  const activeShortage = shortages.find((s) => s.kitchenId === kitchen.id && s.verification !== "FULFILLED");

  // Operational status label
  const statusLabel =
    kitchen.status === "CLOSED"
      ? "CLOSED"
      : deficit > 0
      ? "SHORTAGE"
      : kitchen.mealsAvailable < kitchen.estimatedDemand * 1.15
      ? "LOW STOCK"
      : "OPEN";

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border/90 bg-card/98 shadow-2xl backdrop-blur-xl animate-in slide-in-from-right-full duration-200">
      {/* Drawer Header */}
      <div className="flex items-center justify-between border-b border-border/80 px-5 py-4 bg-muted/20">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 font-mono text-xs font-bold">
            {kitchen.id}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground tracking-tight">
              {kitchen.name}
            </h2>
            <p className="text-[11px] text-muted-foreground">{kitchen.operator}</p>
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
        {/* Status Banner */}
        <div className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/30 p-3">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1 font-semibold">
              Operational Status
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold uppercase",
                statusLabel === "SHORTAGE"
                  ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                  : statusLabel === "LOW STOCK"
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                  : statusLabel === "CLOSED"
                  ? "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300"
                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
              )}
            >
              {statusLabel}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1 font-semibold">
              Host Sector
            </span>
            <span className="font-bold text-foreground">
              {kitchen.zoneId} {zone ? `· ${zone.name}` : ""}
            </span>
          </div>
        </div>

        {/* Live Snapshot Metrics */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-border/70 bg-card p-2.5">
            <span className="text-[10px] text-muted-foreground block font-medium">Meals Available</span>
            <p className="mt-1 text-base font-bold text-foreground font-mono">
              {kitchen.mealsAvailable.toLocaleString()}
            </p>
          </div>

          <div className="rounded-lg border border-border/70 bg-card p-2.5">
            <span className="text-[10px] text-muted-foreground block font-medium">Est. Demand</span>
            <p className="mt-1 text-base font-bold text-foreground font-mono">
              {kitchen.estimatedDemand.toLocaleString()}
            </p>
          </div>

          <div
            className={cn(
              "rounded-lg border p-2.5",
              deficit > 0
                ? "border-rose-300 bg-rose-50/40 dark:bg-rose-950/20"
                : "border-border/70 bg-card"
            )}
          >
            <span className="text-[10px] text-muted-foreground block font-medium">Net Deficit</span>
            <p
              className={cn(
                "mt-1 text-base font-bold font-mono",
                deficit > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600"
              )}
            >
              {deficit > 0 ? `-${deficit.toLocaleString()}` : "Surplus"}
            </p>
          </div>
        </div>

        {/* Supply vs Demand Comparison Chart */}
        <div className="rounded-lg border border-border/80 bg-card p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-primary" /> Supply vs Demand Chart
            </span>
            <span
              className={cn(
                "font-mono font-bold text-xs",
                supplyRatio < 75 ? "text-rose-600" : supplyRatio < 95 ? "text-amber-600" : "text-emerald-600"
              )}
            >
              {supplyRatio}% met
            </span>
          </div>

          {/* Visual Dual Bars */}
          <div className="space-y-2 pt-1">
            <div>
              <div className="flex justify-between text-[11px] mb-1 font-mono">
                <span className="text-muted-foreground">Meals Available (Supply)</span>
                <span className="font-bold text-foreground">{kitchen.mealsAvailable.toLocaleString()}</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full transition-all duration-500",
                    deficit > 0 ? "bg-rose-500" : "bg-emerald-500"
                  )}
                  style={{ width: `${Math.min(100, supplyRatio)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1 font-mono">
                <span className="text-muted-foreground">Estimated Demand (100%)</span>
                <span className="font-bold text-foreground">{kitchen.estimatedDemand.toLocaleString()}</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
                <div className="h-full bg-primary/70" style={{ width: "100%" }} />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] border-t border-border/60 pt-2 text-muted-foreground">
            <span>Deficit: <b className={deficit > 0 ? "text-rose-600" : "text-emerald-600"}>{deficit > 0 ? `-${deficit.toLocaleString()} meals` : "0 (Surplus)"}</b></span>
            <span>
              Updated:{" "}
              <b className="text-foreground">
                {kitchen.updatedMinutesAgo === 0 ? "42 sec ago" : `${kitchen.updatedMinutesAgo}m ago`}
              </b>
            </span>
          </div>
        </div>

        {/* Recent Updates Timeline */}
        <div className="rounded-lg border border-border/80 bg-card p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" /> Recent Updates
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">Audit Log</span>
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex items-start gap-2 text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <div>
                <p className="text-foreground font-medium">Stock telemetry synced: {kitchen.mealsAvailable.toLocaleString()} meals</p>
                <span className="text-[10px] text-muted-foreground">
                  {kitchen.updatedMinutesAgo === 0 ? "42 sec ago" : `${kitchen.updatedMinutesAgo}m ago`} · Field Sensor
                </span>
              </div>
            </div>

            {deficit > 0 && (
              <div className="flex items-start gap-2 text-[11px]">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                <div>
                  <p className="text-foreground font-medium">Deficit alert flagged (-{deficit.toLocaleString()} shortfall)</p>
                  <span className="text-[10px] text-muted-foreground">14m ago · System Automated</span>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2 text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <div>
                <p className="text-foreground font-medium">Elevated demand curve detected from {kitchen.zoneId}</p>
                <span className="text-[10px] text-muted-foreground">38m ago · Telemetry Engine</span>
              </div>
            </div>

            <div className="flex items-start gap-2 text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
              <div>
                <p className="text-foreground font-medium">Previous consignment verified & logged</p>
                <span className="text-[10px] text-muted-foreground">2h ago · Logistics Desk</span>
              </div>
            </div>
          </div>
        </div>

        {/* Nearby Crowd Context */}
        <div className="rounded-lg border border-border/80 bg-card p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-primary" /> Nearby Crowd
            </span>
            {zone && (
              <span className="font-mono text-[10px] font-bold text-primary">
                {zone.pilgrims.toLocaleString()} pilgrims
              </span>
            )}
          </div>

          {zone ? (
            <div className="flex items-center justify-between rounded-md border border-border/60 bg-muted/20 p-2 text-xs">
              <div>
                <span className="font-semibold text-foreground">{zone.name} ({zone.id})</span>
                <span className="text-muted-foreground block text-[11px]">{zone.area}</span>
              </div>
              <div className="text-right">
                <StatusBadge value={zone.crowd} kind="crowd" />
                <span className="block mt-0.5 text-[10px] text-muted-foreground">
                  {zone.trend === "INCREASING" ? "Surge Inflow" : "Stable Flow"}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground">Zone telemetry unavailable</p>
          )}

          <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
            {deficit > 0
              ? `High footfall in ${zone?.name || "this sector"} is creating acute demand pressure on ${kitchen.name}. Immediate replenishment or pilgrim diversion to nearby surplus kitchens recommended.`
              : `Current meal stock is adequately buffered against projected sector footfall.`}
          </p>
        </div>

        {/* Nearby Food Points */}
        <div className="rounded-lg border border-border/80 bg-card p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
              Nearby Food Points
            </span>
            <span className="text-[10px] text-emerald-600 font-medium">Alternative Options</span>
          </div>

          <div className="space-y-1.5">
            {nearbyKitchens.length > 0 ? (
              nearbyKitchens.map((nk) => (
                <div
                  key={nk.id}
                  className="flex items-center justify-between rounded border border-border/60 bg-muted/20 px-2.5 py-1.5 text-[11px]"
                >
                  <div>
                    <span className="font-mono font-semibold">{nk.id}</span>
                    <span className="text-muted-foreground ml-1.5">{nk.name}</span>
                    <span className="text-[10px] text-muted-foreground block font-mono">Zone {nk.zoneId}</span>
                  </div>
                  <div className="text-right font-mono">
                    <span className="font-bold text-emerald-600 block">
                      {nk.mealsAvailable.toLocaleString()} meals
                    </span>
                    <span className="text-[10px] text-muted-foreground">{nk.status}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[11px] text-muted-foreground italic">No alternate kitchens nearby</p>
            )}
          </div>
        </div>

        {/* Facility Registry Details */}
        <div className="rounded-lg border border-border/80 bg-muted/20 p-3 space-y-2">
          <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider block">
            Facility Registry & Contact
          </span>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-muted-foreground block text-[10px]">Daily Capacity</span>
              <span className="font-mono font-bold text-foreground">
                {(kitchen.capacity || 4000).toLocaleString()} meals/day
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">Data Quality</span>
              <span className="font-semibold text-foreground">{kitchen.quality}</span>
            </div>
          </div>

          <div className="border-t border-border/60 pt-2 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <User className="h-3.5 w-3.5 text-primary" />
              <span className="text-foreground font-medium">{kitchen.contactPerson || "Field Coordinator"}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground font-mono text-[10px]">
              <Phone className="h-3 w-3 text-emerald-600" />
              <span>{kitchen.contactPhone || "+91 98230 00000"}</span>
            </div>
          </div>
        </div>

        {/* Shortage Verification Status & Sponsor Meals CTA */}
        {activeShortage && (
          <div className="rounded-lg border border-amber-300 bg-amber-50/60 dark:bg-amber-950/20 p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" /> Active Shortage Flag: {activeShortage.id}
              </span>
              <span className="rounded bg-amber-200/60 dark:bg-amber-900/60 px-1.5 py-0.2 text-[10px] font-bold text-amber-900 dark:text-amber-200">
                {activeShortage.verification}
              </span>
            </div>
            <p className="text-xs text-amber-950/90 dark:text-amber-200/90">
              Reported {activeShortage.reportedMinutesAgo}m ago. Deficit: <b>{activeShortage.mealsRequired} meals</b>.
            </p>
            {activeShortage.verificationNotes && (
              <p className="text-[11px] text-muted-foreground italic">
                "{activeShortage.verificationNotes}"
              </p>
            )}

            {onDonate && (
              <Button
                type="button"
                size="sm"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5 h-8 mt-1"
                onClick={() => onDonate(activeShortage, kitchen)}
              >
                <Heart className="h-3.5 w-3.5 fill-white" />
                Sponsor Meals for this Shortage
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Action Command Footer: [Update Stock] [Verify Shortage] [Create Alert] [Close Kitchen] */}
      <div className="border-t border-border/80 bg-card p-4 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="outline"
            className="w-full gap-1.5 text-xs font-semibold"
            onClick={() => onUpdateStock(kitchen)}
          >
            <Package className="h-3.5 w-3.5 text-primary" /> Update Stock
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="w-full gap-1.5 text-xs font-semibold border-amber-400 bg-amber-50/50 hover:bg-amber-100 text-amber-900 dark:text-amber-200"
            onClick={() => {
              if (activeShortage) {
                onVerifyShortage(activeShortage.id);
              } else {
                onVerifyShortage(`SH-${kitchen.id}`);
              }
            }}
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-amber-600" /> Verify Shortage
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="outline"
            className="w-full gap-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20"
            onClick={() => onCreateAlert(kitchen, zone)}
          >
            <ShieldAlert className="h-3.5 w-3.5" /> Create Alert
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="w-full gap-1.5 text-xs text-stone-600 hover:text-stone-900 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900"
            onClick={() => onCloseKitchen(kitchen)}
          >
            <PowerOff className="h-3.5 w-3.5" /> Close Kitchen
          </Button>
        </div>

        <Button
          size="sm"
          variant="ghost"
          className="w-full gap-1.5 text-[11px] text-muted-foreground hover:text-foreground h-7"
          onClick={() => onViewDetail(kitchen.id)}
        >
          <span>Open Full Kitchen Roster Record</span>
          <ArrowRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
