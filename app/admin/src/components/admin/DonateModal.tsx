import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, X, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { donateToShortage } from "@/services";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { Kitchen, Shortage } from "@/types";

interface DonateModalProps {
  shortage: Shortage | null;
  kitchen: Kitchen | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DonateModal({ shortage, kitchen, isOpen, onClose }: DonateModalProps) {
  const qc = useQueryClient();

  const [mealsCount, setMealsCount] = useState<number>(100);
  const [donorName, setDonorName] = useState("");
  const [phone, setPhone] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "CARD" | "NETBANKING">("UPI");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !shortage) return null;

  const costPerMeal = shortage.costPerMeal || 35;
  const totalAmount = mealsCount * costPerMeal;
  const deficit = shortage.mealsRequired;
  const targetFunds = shortage.targetFunds || deficit * costPerMeal;
  const fundsRaised = shortage.fundsRaised || 0;
  const remainingFunds = Math.max(0, targetFunds - fundsRaised);

  const handlePreset = (count: number) => {
    setMealsCount(count);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mealsCount <= 0) {
      toast.error("Please enter a valid meal quantity.");
      return;
    }

    setIsSubmitting(true);
    try {
      await donateToShortage({
        shortageId: shortage.id,
        mealsSponsored: mealsCount,
        amount: totalAmount,
        donorName: isAnonymous ? "Anonymous Philanthropist" : donorName.trim() || "Devotee Donor",
        paymentMethod,
        anonymous: isAnonymous,
      });

      qc.invalidateQueries({ queryKey: ["shortages"] });
      qc.invalidateQueries({ queryKey: ["kitchens"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });

      toast.success(
        `Blessed Contribution! ₹${totalAmount.toLocaleString()} sponsored for ${mealsCount} meals at ${
          kitchen?.name || shortage.kitchenId
        }.`,
      );
      onClose();
    } catch (err) {
      toast.error("Donation simulation failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in" onClick={onClose} />

      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/70">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600">
              <Heart className="h-5 w-5 fill-rose-500/20" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Direct-to-Shortage Meal Sponsorship</h3>
              <p className="text-xs text-muted-foreground">Directly fund verified meal deficit at high-need annakshetra</p>
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

        {/* Shortage Target Context Card */}
        <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50/50 dark:bg-amber-950/20 p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-900 dark:text-amber-300">
              {shortage.id} · {kitchen?.name || shortage.kitchenId}
            </span>
            <span className="rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 px-1.5 py-0.5 text-[10px] font-bold">
              DEFICIT: -{deficit} MEALS
            </span>
          </div>

          <p className="text-muted-foreground text-[11px] leading-relaxed">
            <b>Ground Verification:</b> {shortage.verificationNotes || "Verified emergency deficit from heavy sector footfall."}
          </p>

          <div className="flex items-center justify-between border-t border-amber-200/60 dark:border-amber-900/60 pt-2 text-[11px] font-mono">
            <span>Target: ₹{targetFunds.toLocaleString()}</span>
            <span>Raised: <b className="text-emerald-600">₹{fundsRaised.toLocaleString()}</b></span>
            <span>Unfunded: <b className="text-rose-600">₹{remainingFunds.toLocaleString()}</b></span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Preset Buttons */}
          <div>
            <label className="mb-1.5 block font-semibold text-foreground">
              Select Meal Sponsorship Tier (₹{costPerMeal} / meal)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[20, 50, 100, 250].map((count) => {
                const cost = count * costPerMeal;
                const isSelected = mealsCount === count;
                return (
                  <button
                    key={count}
                    type="button"
                    onClick={() => handlePreset(count)}
                    className={`rounded-lg border p-2 text-center transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary font-bold ring-2 ring-primary/40"
                        : "border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="block font-mono text-sm">{count}</span>
                    <span className="block text-[10px]">meals</span>
                    <span className="mt-0.5 block font-mono text-[11px] font-semibold">₹{cost}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Meals Input */}
          <div className="grid grid-cols-2 gap-3 items-end">
            <div>
              <label className="mb-1 block font-semibold text-foreground">Custom Meal Count</label>
              <Input
                type="number"
                min={1}
                value={mealsCount}
                onChange={(e) => setMealsCount(Math.max(1, parseInt(e.target.value, 10) || 0))}
                className="h-8 font-mono text-xs"
              />
            </div>

            <div className="rounded-md border border-border/80 bg-muted/40 px-3 py-1.5 text-right">
              <span className="text-[10px] text-muted-foreground block">Total Sponsorship</span>
              <span className="font-mono text-base font-bold text-primary">₹{totalAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Donor Information */}
          <div className="space-y-2 border-t border-border/70 pt-3">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-foreground">Donor Identity</label>
              <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] text-muted-foreground">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded border-border text-primary"
                />
                <span>Sponsor Anonymously</span>
              </label>
            </div>

            {!isAnonymous && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Input
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    placeholder="Full Name (e.g. Ramesh Chandra)"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Mobile for Tax Exemption Receipt"
                    className="h-8 font-mono text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="mb-1 block font-semibold text-foreground">Payment Gateway</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "UPI", label: "Instant UPI / QR" },
                { id: "CARD", label: "Debit / Credit Card" },
                { id: "NETBANKING", label: "NetBanking / NEFT" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id as any)}
                  className={`rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition-all text-center ${
                    paymentMethod === m.id
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-muted/20 p-2 rounded">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>100% of contributions are routed directly to grain & ration procurement at this specific kitchen.</span>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-border/70">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
              disabled={isSubmitting}
            >
              <Heart className="h-3.5 w-3.5 fill-white" />
              {isSubmitting ? "Processing..." : `Sponsor ₹${totalAmount.toLocaleString()} (${mealsCount} Meals)`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
