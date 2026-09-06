import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Car, X, Gauge, AlertTriangle, CheckCircle2 } from "lucide-react";
import { updateParkingOccupancy } from "@/services";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { ParkingLot } from "@/types";

interface UpdateOccupancyModalProps {
  lot: ParkingLot | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UpdateOccupancyModal({ lot, isOpen, onClose }: UpdateOccupancyModalProps) {
  const qc = useQueryClient();
  const [occupied, setOccupied] = useState<string>(lot ? String(lot.occupied) : "");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (lot) {
      setOccupied(String(lot.occupied));
    }
  }, [lot]);

  if (!isOpen || !lot) return null;

  const currentOccupied = parseInt(occupied, 10) || 0;
  const clampedOccupied = Math.min(Math.max(0, currentOccupied), lot.capacity);
  const availableBays = Math.max(0, lot.capacity - clampedOccupied);
  const occupancyPct = Math.round((clampedOccupied / lot.capacity) * 100);

  const getStatusBadge = (pct: number) => {
    if (pct >= 100) return { label: "FULL", color: "text-rose-600 bg-rose-50 border-rose-200" };
    if (pct >= 90) return { label: "NEAR CAPACITY", color: "text-orange-600 bg-orange-50 border-orange-200" };
    if (pct >= 70) return { label: "BUSY", color: "text-amber-600 bg-amber-50 border-amber-200" };
    return { label: "AVAILABLE", color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
  };

  const statusInfo = getStatusBadge(occupancyPct);

  const handleQuickPercent = (pct: number) => {
    const val = Math.round((lot.capacity * pct) / 100);
    setOccupied(String(val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const count = parseInt(occupied, 10);
    if (isNaN(count) || count < 0) {
      toast.error("Please enter a valid non-negative occupied count.");
      return;
    }
    if (count > lot.capacity) {
      toast.error(`Occupied count cannot exceed total capacity (${lot.capacity.toLocaleString()}).`);
      return;
    }

    setIsUpdating(true);
    try {
      await updateParkingOccupancy(lot.id, count);
      qc.invalidateQueries({ queryKey: ["parking"] });
      qc.invalidateQueries({ queryKey: ["parking", lot.id] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success(`Occupancy updated: ${lot.id} is now ${count.toLocaleString()} / ${lot.capacity.toLocaleString()} (${occupancyPct}%)`);
      onClose();
    } catch (err) {
      toast.error("Failed to update parking occupancy.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-border/70">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Car className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Update Vehicle Count</h3>
              <p className="text-xs text-muted-foreground">{lot.name} ({lot.id})</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-3 gap-2 text-xs rounded-lg border border-border/70 bg-muted/20 p-3">
            <div>
              <span className="text-muted-foreground block text-[10px]">Total Capacity:</span>
              <span className="font-bold font-mono text-sm">{lot.capacity.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">Projected Available:</span>
              <span className="font-bold font-mono text-sm text-emerald-600">{availableBays.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">Occupancy:</span>
              <span className="font-bold font-mono text-sm">{occupancyPct}%</span>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-foreground">
              Occupied Vehicles (Current telemetry: {lot.occupied.toLocaleString()})
            </label>
            <Input
              type="number"
              min={0}
              max={lot.capacity}
              required
              value={occupied}
              onChange={(e) => setOccupied(e.target.value)}
              placeholder={`0 - ${lot.capacity}`}
              className="font-mono text-sm h-9"
            />
          </div>

          {/* Quick Percentage Presets */}
          <div>
            <span className="text-[11px] font-medium text-muted-foreground mb-1.5 block">Quick Preset Adjustments:</span>
            <div className="grid grid-cols-5 gap-1.5">
              {[25, 50, 75, 90, 96].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleQuickPercent(p)}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                    occupancyPct === p
                      ? "bg-primary text-primary-foreground font-bold border-primary"
                      : "bg-muted/40 hover:bg-muted text-foreground border-border/70"
                  }`}
                >
                  {p}%
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-border/60 bg-muted/30 p-2.5 text-xs flex items-center justify-between">
            <span className="text-muted-foreground">Projected Operational State:</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border/70">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isUpdating}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="bg-primary text-primary-foreground font-semibold" disabled={isUpdating}>
              {isUpdating ? "Saving Telemetry..." : "Save Occupancy"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
