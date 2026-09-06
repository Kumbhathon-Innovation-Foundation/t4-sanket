import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Compass, ArrowRight, CheckCircle2, ShieldAlert, X, AlertTriangle } from "lucide-react";
import { setRouteStatus } from "@/services";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface DiversionModalProps {
  isOpen: boolean;
  onClose: () => void;
  zoneId?: string;
  sourceRouteId?: string;
  targetRouteId?: string;
}

export function DiversionModal({
  isOpen,
  onClose,
  zoneId = "Z07",
  sourceRouteId = "R17",
  targetRouteId = "R18",
}: DiversionModalProps) {
  const qc = useQueryClient();
  const [isActivating, setIsActivating] = useState(false);

  if (!isOpen) return null;

  const handleActivate = async () => {
    setIsActivating(true);
    try {
      await setRouteStatus(sourceRouteId, "DIVERSION");
      await setRouteStatus(targetRouteId, "RECOMMENDED");
      qc.invalidateQueries({ queryKey: ["routes"] });
      qc.invalidateQueries({ queryKey: ["zones"] });
      toast.success(`Diversion active: ${sourceRouteId} redirected via ${targetRouteId}. Signage updated!`);
      onClose();
    } catch (err) {
      toast.error("Failed to update route statuses.");
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in" onClick={onClose} />

      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/70">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Recommend Pedestrian Diversion</h3>
              <p className="text-xs text-muted-foreground">Relieve surge pressure on critical approach routes</p>
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

        {/* Corridor Comparison */}
        <div className="mt-4 space-y-3">
          {/* Congested Route */}
          <div className="rounded-lg border border-rose-300 bg-rose-50/50 dark:bg-rose-950/20 p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono text-rose-700 dark:text-rose-400">
                CORRIDOR: {sourceRouteId} (Primary)
              </span>
              <span className="rounded bg-rose-200/60 dark:bg-rose-900/60 px-2 py-0.5 text-[10px] font-bold text-rose-800 dark:text-rose-300">
                CONGESTED · 92% CAPACITY
              </span>
            </div>
            <p className="text-xs text-foreground font-medium">
              Kushavarta Feeder → Main Snan Ghat Steps
            </p>
            <p className="text-[11px] text-muted-foreground">
              Distance: 2.1 km · Walking Time: 34 min · Crowd: HIGH
            </p>
          </div>

          <div className="flex justify-center -my-1 text-muted-foreground">
            <ArrowRight className="h-4 w-4 rotate-90" />
          </div>

          {/* Recommended Alternative Route */}
          <div className="rounded-lg border border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono text-emerald-700 dark:text-emerald-400">
                RECOMMENDED ALTERNATIVE: {targetRouteId}
              </span>
              <span className="rounded bg-emerald-200/60 dark:bg-emerald-900/60 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                SMOOTH FLOW · 46% CAPACITY
              </span>
            </div>
            <p className="text-xs text-foreground font-medium">
              Kushavarta Feeder → Main Snan Ghat (West Loop Bypass)
            </p>
            <p className="text-[11px] text-muted-foreground">
              Distance: 2.5 km · Walking Time: 39 min · Crowd: MODERATE
            </p>
          </div>
        </div>

        {/* Tactical Explanation */}
        <div className="mt-4 rounded-lg border border-border/80 bg-muted/30 p-3 text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Tactical Benefit:</strong> Although {targetRouteId} is 400m longer, it bypasses the stepped bottleneck at Ram Kund North, cutting overall congestion risk and reducing holding times by an estimated 14 minutes.
        </div>

        {/* Automated Broadcast Checkboxes */}
        <div className="mt-4 space-y-1.5 text-xs text-foreground font-medium">
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked className="rounded border-border text-primary" />
            <span>Update Highway & Sector VMS Electronic Signboards</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked className="rounded border-border text-primary" />
            <span>Notify Volunteer Marshals on Sector R17 / R18</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked className="rounded border-border text-primary" />
            <span>Broadcast Push Advisory to Pilgrim App Users approaching {zoneId}</span>
          </label>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex justify-end gap-2.5">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isActivating}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="gap-2 bg-primary text-primary-foreground font-semibold"
            disabled={isActivating}
            onClick={handleActivate}
          >
            <Compass className="h-4 w-4" />
            {isActivating ? "Activating Diversion..." : "Activate Diversion Broadcast"}
          </Button>
        </div>
      </div>
    </div>
  );
}
