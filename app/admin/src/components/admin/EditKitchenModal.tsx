import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Building2, Save } from "lucide-react";
import { updateKitchenRegistry } from "@/services";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { Kitchen, Zone } from "@/types";

interface EditKitchenModalProps {
  kitchen: Kitchen | null;
  zones?: Zone[];
  isOpen: boolean;
  onClose: () => void;
}

export function EditKitchenModal({ kitchen, zones = [], isOpen, onClose }: EditKitchenModalProps) {
  const qc = useQueryClient();

  const [name, setName] = useState("");
  const [operator, setOperator] = useState("");
  const [capacity, setCapacity] = useState("4000");
  const [contactPerson, setContactPerson] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [zoneId, setZoneId] = useState("Z01");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (kitchen) {
      setName(kitchen.name || "");
      setOperator(kitchen.operator || "");
      setCapacity(kitchen.capacity ? String(kitchen.capacity) : "4000");
      setContactPerson(kitchen.contactPerson || "");
      setContactPhone(kitchen.contactPhone || "");
      setZoneId(kitchen.zoneId || "Z01");
    }
  }, [kitchen]);

  if (!isOpen || !kitchen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateKitchenRegistry(kitchen.id, {
        name: name.trim(),
        operator: operator.trim(),
        capacity: parseInt(capacity, 10) || 4000,
        contactPerson: contactPerson.trim(),
        contactPhone: contactPhone.trim(),
        zoneId,
      });

      qc.invalidateQueries({ queryKey: ["kitchens"] });
      qc.invalidateQueries({ queryKey: ["kitchen", kitchen.id] });
      toast.success(`Registry record for ${kitchen.id} (${name}) updated!`);
      onClose();
    } catch (err) {
      toast.error("Failed to update kitchen details.");
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
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Edit Kitchen Registry Record</h3>
              <p className="text-xs text-muted-foreground">Update facility throughput capacity & contacts</p>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-semibold text-foreground">Kitchen ID</label>
              <Input disabled value={kitchen.id} className="h-8 font-mono text-xs bg-muted/40" />
            </div>

            <div>
              <label className="mb-1 block font-semibold text-foreground">Host Sector</label>
              <select
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs"
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.id} — {z.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block font-semibold text-foreground">Facility Name</label>
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          <div>
            <label className="mb-1 block font-semibold text-foreground">Operating Trust / Organization</label>
            <Input
              required
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          <div>
            <label className="mb-1 block font-semibold text-foreground">Daily Preparation Capacity (meals/day)</label>
            <Input
              type="number"
              min={0}
              required
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="h-8 font-mono text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-semibold text-foreground">Coordinator In-Charge</label>
              <Input
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Mahant Ramdas"
                className="h-8 text-xs"
              />
            </div>

            <div>
              <label className="mb-1 block font-semibold text-foreground">Emergency Phone</label>
              <Input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+91 98230 XXXXX"
                className="h-8 font-mono text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border/70">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="bg-primary text-primary-foreground font-semibold gap-1.5" disabled={isSubmitting}>
              <Save className="h-3.5 w-3.5" />
              {isSubmitting ? "Saving..." : "Save Registry Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
