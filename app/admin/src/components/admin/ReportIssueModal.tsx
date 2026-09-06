import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, X, ShieldAlert, CheckCircle2 } from "lucide-react";
import { reportFacilityIssue } from "@/services";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { Facility } from "@/types";

interface ReportIssueModalProps {
  facility: Facility | null;
  isOpen: boolean;
  onClose: () => void;
}

const ISSUE_CATEGORIES = [
  "Sanitation flush malfunction / Blockage",
  "Water tanker supply depleted",
  "Medical supplies / First-aid depleted",
  "Lighting / Electrical outage",
  "Queue railing structural damage",
  "Accessibility ramp blocked",
];

export function ReportIssueModal({ facility, isOpen, onClose }: ReportIssueModalProps) {
  const qc = useQueryClient();
  const [category, setCategory] = useState(ISSUE_CATEGORIES[0]);
  const [details, setDetails] = useState("");
  const [urgency, setUrgency] = useState<"NORMAL" | "HIGH" | "CRITICAL">("HIGH");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !facility) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const fullIssueText = `[${urgency}] ${category}${details ? ` - ${details}` : ""}`;

    try {
      await reportFacilityIssue(facility.id, fullIssueText);
      await qc.invalidateQueries({ queryKey: ["facilities"] });
      await qc.invalidateQueries({ queryKey: ["facility", facility.id] });
      await qc.invalidateQueries({ queryKey: ["audit"] });
      toast.warning(`Issue logged for ${facility.id}: Flagged as NEEDS ATTENTION`, {
        description: "Maintenance ticket dispatched to Kumbh sanitation response unit.",
      });
      onClose();
    } catch (err) {
      toast.error("Failed to report facility issue.");
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
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Report Facility Issue</h3>
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
          <div>
            <label className="mb-1.5 block font-semibold text-foreground">
              Issue Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-xs text-foreground focus:outline-hidden"
            >
              {ISSUE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block font-semibold text-foreground">
              Urgency Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["NORMAL", "HIGH", "CRITICAL"] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUrgency(u)}
                  className={`rounded-lg border p-2 text-center text-xs font-semibold transition-all ${
                    urgency === u
                      ? u === "CRITICAL"
                        ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                        : "bg-amber-600 text-white border-amber-600 shadow-xs"
                      : "bg-muted/40 hover:bg-muted border-border/70 text-foreground"
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block font-semibold text-foreground">
              Observer Notes / Details
            </label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="e.g. Tanker valve leaking; requires plumbing crew immediately..."
              className="w-full rounded-md border border-border bg-card p-2 text-xs text-foreground focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border/70">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Dispatching..." : "Dispatch Incident Ticket"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
