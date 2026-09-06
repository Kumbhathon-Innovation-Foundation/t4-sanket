import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package, X, CheckCircle2 } from "lucide-react";
import { updateKitchenStock } from "@/services";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { Kitchen } from "@/types";

interface UpdateStockModalProps {
  kitchen: Kitchen | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UpdateStockModal({ kitchen, isOpen, onClose }: UpdateStockModalProps) {
  const qc = useQueryClient();
  const [meals, setMeals] = useState<string>(kitchen ? String(kitchen.mealsAvailable) : "");
  const [isUpdating, setIsUpdating] = useState(false);

  React.useEffect(() => {
    if (kitchen) {
      setMeals(String(kitchen.mealsAvailable));
    }
  }, [kitchen]);

  if (!isOpen || !kitchen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const count = parseInt(meals, 10);
    if (isNaN(count) || count < 0) {
      toast.error("Please enter a valid non-negative meal count.");
      return;
    }

    setIsUpdating(true);
    try {
      await updateKitchenStock(kitchen.id, count);
      qc.invalidateQueries({ queryKey: ["kitchens"] });
      qc.invalidateQueries({ queryKey: ["kitchen", kitchen.id] });
      qc.invalidateQueries({ queryKey: ["shortages"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success(`Inventory updated: ${kitchen.id} now has ${count.toLocaleString()} meals available.`);
      onClose();
    } catch (err) {
      toast.error("Failed to update kitchen stock.");
    } finally {
      setIsUpdating(false);
    }
  };

  const newCount = parseInt(meals, 10) || 0;
  const newDeficit = Math.max(0, kitchen.estimatedDemand - newCount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-border/70">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Update Meal Stock</h3>
              <p className="text-xs text-muted-foreground">{kitchen.name} ({kitchen.id})</p>
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
          <div className="grid grid-cols-2 gap-2 text-xs rounded-lg border border-border/70 bg-muted/20 p-3">
            <div>
              <span className="text-muted-foreground block text-[11px]">Current Available:</span>
              <span className="font-bold font-mono text-sm">{kitchen.mealsAvailable.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Estimated Demand:</span>
              <span className="font-bold font-mono text-sm">{kitchen.estimatedDemand.toLocaleString()}</span>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-foreground">
              New Meals Available Count
            </label>
            <Input
              type="number"
              min={0}
              required
              value={meals}
              onChange={(e) => setMeals(e.target.value)}
              placeholder="e.g. 2500"
              className="font-mono text-sm h-9"
            />
          </div>

          <div className="rounded-md border border-border/60 bg-muted/30 p-2.5 text-xs text-muted-foreground">
            <span>Projected Balance: </span>
            <b className={newDeficit > 0 ? "text-rose-600" : "text-emerald-600"}>
              {newDeficit > 0 ? `${newDeficit.toLocaleString()} meal deficit` : "Adequate supply buffer"}
            </b>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border/70">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isUpdating}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="bg-primary text-primary-foreground font-semibold" disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Save Stock Count"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
