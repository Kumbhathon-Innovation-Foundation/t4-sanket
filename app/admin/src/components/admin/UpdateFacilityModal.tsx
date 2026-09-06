import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wrench, X, Clock, Sliders, CheckCircle2 } from "lucide-react";
import { updateFacilityQueue, setFacilityStatus } from "@/services";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { Facility, CrowdLevel } from "@/types";

interface UpdateFacilityModalProps {
  facility: Facility | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UpdateFacilityModal({ facility, isOpen, onClose }: UpdateFacilityModalProps) {
  const qc = useQueryClient();
  const [queue, setQueue] = useState<CrowdLevel>("LOW");
  const [waitMinutes, setWaitMinutes] = useState<string>("0");
  const [status, setStatus] = useState<Facility["status"]>("OPEN");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (facility) {
      setQueue(facility.queue);
      setWaitMinutes(String(facility.waitMinutes));
      setStatus(facility.status);
    }
  }, [facility]);

  if (!isOpen || !facility) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const wait = parseInt(waitMinutes, 10);
    if (isNaN(wait) || wait < 0) {
      toast.error("Please enter a valid non-negative wait time.");
      return;
    }

    setIsUpdating(true);
    try {
      await updateFacilityQueue(facility.id, queue, wait);
      if (status !== facility.status) {
        await setFacilityStatus(facility.id, status);
      }
      await qc.invalidateQueries({ queryKey: ["facilities"] });
      await qc.invalidateQueries({ queryKey: ["facility", facility.id] });
      await qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success(`Facility ${facility.id} updated: ${queue} Queue (~${wait} min wait)`);
      onClose();
    } catch (err) {
      toast.error("Failed to update facility queue.");
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
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Update Queue & Status</h3>
              <p className="text-xs text-muted-foreground">{facility.name} ({facility.id})</p>
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Status Selection */}
          <div>
            <label className="mb-1.5 block font-semibold text-foreground">
              Operational Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["OPEN", "NEEDS_ATTENTION", "CLOSED"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatus(st)}
                  className={`rounded-lg border p-2 text-center text-xs font-semibold transition-all ${
                    status === st
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-muted/40 hover:bg-muted border-border/70 text-foreground"
                  }`}
                >
                  {st.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Queue Selection */}
          <div>
            <label className="mb-1.5 block font-semibold text-foreground">
              Current Queue Pressure
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(["LOW", "MODERATE", "HIGH", "PEAK"] as const).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    setQueue(q);
                    if (q === "LOW") setWaitMinutes("2");
                    if (q === "MODERATE") setWaitMinutes("5");
                    if (q === "HIGH") setWaitMinutes("8");
                    if (q === "PEAK") setWaitMinutes("15");
                  }}
                  className={`rounded-lg border p-2 text-center text-xs font-semibold transition-all ${
                    queue === q
                      ? "bg-stone-900 text-white border-primary ring-1 ring-primary"
                      : "bg-muted/40 hover:bg-muted border-border/70 text-foreground"
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Estimated Wait Minutes */}
          <div>
            <label className="mb-1 block font-semibold text-foreground">
              Estimated Wait Time (Minutes)
            </label>
            <div className="relative">
              <Input
                type="number"
                min={0}
                max={120}
                required
                value={waitMinutes}
                onChange={(e) => setWaitMinutes(e.target.value)}
                className="font-mono text-sm h-9 pl-8"
              />
              <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border/70">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isUpdating}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="bg-primary text-primary-foreground font-semibold" disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Save Telemetry"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
