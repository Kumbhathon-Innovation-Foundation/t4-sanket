import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, AlertTriangle, ShieldAlert } from "lucide-react";
import { flagNewShortage } from "@/services";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { Kitchen, Zone, OpStatus } from "@/types";

interface FlagShortageModalProps {
  kitchens?: Kitchen[];
  zones?: Zone[];
  isOpen: boolean;
  onClose: () => void;
  preselectedKitchenId?: string;
}

export function FlagShortageModal({
  kitchens = [],
  zones = [],
  isOpen,
  onClose,
  preselectedKitchenId,
}: FlagShortageModalProps) {
  const qc = useQueryClient();

  const [kitchenId, setKitchenId] = useState(preselectedKitchenId || kitchens[0]?.id || "K12");
  const [mealsRequired, setMealsRequired] = useState("500");
  const [severity, setSeverity] = useState<OpStatus>("CRITICAL");
  const [verifiedBy, setVerifiedBy] = useState("Volunteer Field Runner");
  const [verificationNotes, setVerificationNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const selectedKitchen = kitchens.find((k) => k.id === kitchenId) || kitchens[0];
  const zoneId = selectedKitchen ? selectedKitchen.zoneId : "Z01";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const count = parseInt(mealsRequired, 10) || 0;
    if (count <= 0) {
      toast.error("Please specify a valid meal shortfall amount.");
      return;
    }

    setIsSubmitting(true);
    try {
      await flagNewShortage({
        kitchenId,
        zoneId,
        mealsRequired: count,
        severity,
        verifiedBy: verifiedBy.trim() || "Ground Volunteer",
        verificationNotes:
          verificationNotes.trim() ||
          `Direct physical observation of queue exceeding buffer stock at ${selectedKitchen?.name || kitchenId}.`,
      });

      qc.invalidateQueries({ queryKey: ["shortages"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success(`Shortage flagged and verified for ${selectedKitchen?.name || kitchenId}!`);
      onClose();
    } catch (err) {
      toast.error("Failed to submit shortage report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-border/70">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Flag Ground Meal Shortage</h3>
              <p className="text-xs text-muted-foreground">Volunteer & Coordinator verified-need reporting</p>
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div>
            <label className="mb-1 block font-semibold text-foreground">Target Annakshetra / Kitchen</label>
            <select
              value={kitchenId}
              onChange={(e) => setKitchenId(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs"
            >
              {kitchens.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.id} · {k.name} ({k.zoneId})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-semibold text-foreground">Immediate Meals Required</label>
              <Input
                type="number"
                min={50}
                step={50}
                required
                value={mealsRequired}
                onChange={(e) => setMealsRequired(e.target.value)}
                className="h-8 font-mono text-xs"
              />
            </div>

            <div>
              <label className="mb-1 block font-semibold text-foreground">Severity Level</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-semibold"
              >
                <option value="CRITICAL">CRITICAL (Emergency Deficit)</option>
                <option value="WARNING">WARNING (Low Buffer)</option>
                <option value="STABLE">STABLE (Precautionary)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block font-semibold text-foreground">Reporting Volunteer / Coordinator</label>
            <Input
              required
              value={verifiedBy}
              onChange={(e) => setVerifiedBy(e.target.value)}
              placeholder="e.g. Vol. Sandeep Rane (Sector 07 Lead)"
              className="h-8 text-xs"
            />
          </div>

          <div>
            <label className="mb-1 block font-semibold text-foreground">Ground Physical Observations</label>
            <textarea
              rows={3}
              required
              value={verificationNotes}
              onChange={(e) => setVerificationNotes(e.target.value)}
              placeholder="e.g. Surge of 2,000 pilgrims entering from Ghat feeder; kitchen has less than 20 mins of khichdi left."
              className="w-full rounded-md border border-input bg-background p-2.5 text-xs resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border/70">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold gap-1.5"
              disabled={isSubmitting}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              {isSubmitting ? "Submitting..." : "Flag Verified Shortage"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
