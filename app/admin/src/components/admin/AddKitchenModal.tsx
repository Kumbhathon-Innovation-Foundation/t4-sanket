import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Utensils, MapPin } from "lucide-react";
import { addKitchen } from "@/services";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { Kitchen, Zone } from "@/types";

// Standard realistic Nashik GPS coords for Kumbh zones
const ZONE_PRESET_COORDS: Record<string, { lat: number; lng: number; x: number; y: number; landmark: string }> = {
  Z01: { lat: 20.0035, lng: 73.8180, x: 14, y: 20, landmark: "Tapovan Eastern Gate" },
  Z02: { lat: 20.0070, lng: 73.8120, x: 37, y: 16, landmark: "Tapovan Central Grounds" },
  Z03: { lat: 20.0090, lng: 73.7960, x: 61, y: 20, landmark: "Godavari North Bank (Kapaleshwar)" },
  Z04: { lat: 20.0075, lng: 73.7925, x: 83, y: 24, landmark: "Ramkund Access Corridor West" },
  Z05: { lat: 20.0050, lng: 73.7940, x: 18, y: 48, landmark: "Panchavati Historic Core (Kalaram)" },
  Z06: { lat: 19.9990, lng: 73.8040, x: 44, y: 47, landmark: "Sadhugram Outer Encampment" },
  Z07: { lat: 19.9940, lng: 73.7880, x: 71, y: 49, landmark: "Kushavarta Feeder Checkpoint" },
  Z08: { lat: 20.0060, lng: 73.7915, x: 35, y: 72, landmark: "Snan Ghat Main Steps Embankment" },
};

interface AddKitchenModalProps {
  isOpen: boolean;
  onClose: () => void;
  zones?: Zone[];
  onKitchenCreated?: (kitchen: Kitchen) => void;
}

export function AddKitchenModal({ isOpen, onClose, zones = [], onKitchenCreated }: AddKitchenModalProps) {
  const qc = useQueryClient();

  const [id, setId] = useState(`K${Math.floor(25 + Math.random() * 50)}`);
  const [name, setName] = useState("");
  const [operator, setOperator] = useState("");
  const [zoneId, setZoneId] = useState("Z01");
  const [mealsAvailable, setMealsAvailable] = useState("2500");
  const [estimatedDemand, setEstimatedDemand] = useState("2200");
  const [capacity, setCapacity] = useState("4500");
  const [contactPerson, setContactPerson] = useState("");
  const [contactPhone, setContactPhone] = useState("+91 98");

  // Geolocation fields
  const [lat, setLat] = useState<number>(ZONE_PRESET_COORDS["Z01"]?.lat ?? 20.004);
  const [lng, setLng] = useState<number>(ZONE_PRESET_COORDS["Z01"]?.lng ?? 73.738);
  const [landmark, setLandmark] = useState(ZONE_PRESET_COORDS["Z01"]?.landmark ?? "Trimbak Highway Gateway");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync coords when zone changes
  useEffect(() => {
    const preset = ZONE_PRESET_COORDS[zoneId];
    if (preset) {
      const jitterLat = Number((preset.lat + (Math.random() - 0.5) * 0.003).toFixed(5));
      const jitterLng = Number((preset.lng + (Math.random() - 0.5) * 0.003).toFixed(5));
      setLat(jitterLat);
      setLng(jitterLng);
      setLandmark(preset.landmark);
    }
  }, [zoneId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !operator.trim()) {
      toast.error("Please fill in kitchen name and operator.");
      return;
    }

    const meals = parseInt(mealsAvailable, 10) || 0;
    const demand = parseInt(estimatedDemand, 10) || 0;
    const maxCap = parseInt(capacity, 10) || meals * 1.5;

    const preset = ZONE_PRESET_COORDS[zoneId] || { x: 50, y: 50 };

    const newKitchen: Kitchen = {
      id: id.trim().toUpperCase(),
      name: name.trim(),
      operator: operator.trim(),
      zoneId,
      mealsAvailable: meals,
      estimatedDemand: demand,
      capacity: maxCap,
      contactPerson: contactPerson.trim() || "Field Coordinator",
      contactPhone: contactPhone.trim() || "+91 98230 00000",
      status: meals >= demand ? "STABLE" : meals >= demand * 0.85 ? "WARNING" : "CRITICAL",
      quality: "LIVE",
      updatedMinutesAgo: 0,
      point: {
        x: preset.x,
        y: preset.y,
        lat: Number(lat),
        lng: Number(lng),
      },
    };

    setIsSubmitting(true);
    try {
      await addKitchen(newKitchen);
      qc.invalidateQueries({ queryKey: ["kitchens"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success(`Kitchen ${newKitchen.id} (${newKitchen.name}) registered & pinned to map!`);
      if (onKitchenCreated) {
        onKitchenCreated(newKitchen);
      }
      onClose();
    } catch (err) {
      toast.error("Failed to register kitchen.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in" onClick={onClose} />

      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-border/70">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <Utensils className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Register Annakshetra / Kitchen</h3>
              <p className="text-xs text-muted-foreground">Add new meal distribution facility & pin it to GIS map</p>
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
          {/* Identifiers */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-semibold text-foreground">Kitchen ID</label>
              <Input
                required
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="e.g. K25"
                className="h-8 font-mono text-xs"
              />
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
              placeholder="e.g. Annakshetra K25 (Tapovan East Bhandara)"
              className="h-8 text-xs"
            />
          </div>

          <div>
            <label className="mb-1 block font-semibold text-foreground">Operating Trust / Organization</label>
            <Input
              required
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              placeholder="e.g. Shri Sant Janardan Seva Mandal"
              className="h-8 text-xs"
            />
          </div>

          {/* GEOLOCATION PIN SECTION */}
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 text-xs">
                <MapPin className="h-3.5 w-3.5 text-emerald-600" /> Geographic GPS Location (Map Pin)
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">Nashik Godavari GIS</span>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Anchor landmark: <b>{landmark}</b>. Coordinates will automatically pin this kitchen to the live Operations Map.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground block font-mono">Latitude</label>
                <Input
                  type="number"
                  step="0.00001"
                  required
                  value={lat}
                  onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                  className="h-7 text-xs font-mono bg-background"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground block font-mono">Longitude</label>
                <Input
                  type="number"
                  step="0.00001"
                  required
                  value={lng}
                  onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                  className="h-7 text-xs font-mono bg-background"
                />
              </div>
            </div>
          </div>

          {/* Capacity & Stock */}
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="mb-1 block font-semibold text-foreground">Available Meals</label>
              <Input
                type="number"
                min={0}
                required
                value={mealsAvailable}
                onChange={(e) => setMealsAvailable(e.target.value)}
                className="h-8 font-mono text-xs"
              />
            </div>

            <div>
              <label className="mb-1 block font-semibold text-foreground">Est. Demand</label>
              <Input
                type="number"
                min={0}
                required
                value={estimatedDemand}
                onChange={(e) => setEstimatedDemand(e.target.value)}
                className="h-8 font-mono text-xs"
              />
            </div>

            <div>
              <label className="mb-1 block font-semibold text-foreground">Daily Capacity</label>
              <Input
                type="number"
                min={0}
                required
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="h-8 font-mono text-xs"
              />
            </div>
          </div>

          {/* Contacts */}
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
            <Button type="submit" size="sm" className="bg-primary text-primary-foreground font-semibold" disabled={isSubmitting}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              {isSubmitting ? "Registering & Pinning..." : "Register & Pin to Map"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
