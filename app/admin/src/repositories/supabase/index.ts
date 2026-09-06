// Supabase Repository Implementation for PRAVAH (Anubhav)
// Queries PostgreSQL master tables, joins time-series operational observations,
// and invokes PostGIS spatial RPC functions.

import { supabase } from "@/lib/supabase";
import type {
  AdvisoryRepository,
  CrowdRepository,
  EventRepository,
  FacilityRepository,
  FoodRepository,
  GuidanceRepository,
  ParkingRepository,
  PlaceRepository,
  RouteRepository,
  VolunteerRepository,
} from "../interfaces";
import type {
  AutomatedGuidance,
  CrowdLevel,
  CrowdObservation,
  Facility,
  FacilityObservation,
  FoodObservation,
  GuidanceOverride,
  GuidanceRule,
  Kitchen,
  KumbhEvent,
  OpStatus,
  OpsAlert,
  ParkingLot,
  ParkingObservation,
  Place,
  RouteLink,
  RouteObservation,
  RouteStatus,
  Shortage,
  Trend,
  Volunteer,
  Zone,
} from "@/types";
import {
  zones as seedZones,
  kitchens as seedKitchens,
  shortages as seedShortages,
  parkingLots as seedParkingLots,
  facilities as seedFacilities,
  routeLinks as seedRoutes,
  places as seedPlaces,
  events as seedEvents,
  alerts as seedAlerts,
  volunteers as seedVolunteers,
  guidanceRules as seedGuidanceRules,
  automatedGuidanceItems as seedAutoGuidance,
  guidanceOverrides as seedOverrides,
} from "@/data/mock";

const poly = (x: number, y: number, w: number, h: number) => [
  { x, y },
  { x: x + w, y: y + h * 0.12 },
  { x: x + w * 0.92, y: y + h },
  { x: x + w * 0.08, y: y + h * 0.88 },
];

const ZONE_SHAPES: Record<string, { shape: { x: number; y: number }[]; center: { x: number; y: number } }> = {
  Z01: { shape: poly(76, 12, 18, 20), center: { x: 85, y: 22 } },
  Z02: { shape: poly(6, 8, 20, 18), center: { x: 16, y: 17 } },
  Z03: { shape: poly(28, 6, 22, 17), center: { x: 39, y: 14 } },
  Z04: { shape: poly(53, 9, 20, 19), center: { x: 63, y: 18 } },
  Z05: { shape: poly(8, 36, 22, 20), center: { x: 19, y: 46 } },
  Z06: { shape: poly(33, 34, 20, 20), center: { x: 43, y: 44 } },
};

/* -------------------------- Supabase Crowd Repository ------------------------- */

export class SupabaseCrowdRepository implements CrowdRepository {
  async getAllZones(): Promise<Zone[]> {
    const { data: zones, error } = await supabase
      .from("zones")
      .select(`
        id, code, name, area, description, center_latitude, center_longitude, status,
        crowd_observations (
          crowd_level, density_score, estimated_people, trend, confidence, observed_at
        )
      `)
      .order("code", { ascending: true });

    if (error || !zones || zones.length === 0) {
      return seedZones;
    }

    return zones.map((z: any) => {
      // Pick latest observation
      const obs = Array.isArray(z.crowd_observations) && z.crowd_observations.length > 0
        ? z.crowd_observations.sort((a: any, b: any) => new Date(b.observed_at).getTime() - new Date(a.observed_at).getTime())[0]
        : null;

      const observedAt = obs?.observed_at ? new Date(obs.observed_at).getTime() : Date.now();
      const updatedMinutesAgo = Math.max(0, Math.round((Date.now() - observedAt) / 60000));
      const code = z.code || z.id;
      const meta = ZONE_SHAPES[code] || { shape: poly(40, 40, 20, 20), center: { x: 50, y: 50 } };

      return {
        id: code,
        name: z.name,
        area: z.area,
        crowd: (obs?.crowd_level || "MODERATE") as CrowdLevel,
        trend: (obs?.trend || "STABLE") as Trend,
        reports: 5,
        confidence: (obs?.confidence || "HIGH") as any,
        quality: updatedMinutesAgo < 5 ? "LIVE" : "VERIFIED",
        updatedMinutesAgo,
        pilgrims: obs?.estimated_people || 1200,
        shape: meta.shape,
        center: {
          x: meta.center.x,
          y: meta.center.y,
          lat: Number(z.center_latitude) || 20.0075,
          lng: Number(z.center_longitude) || 73.7915,
        },
      };
    });
  }

  async getZoneById(idOrCode: string): Promise<Zone | null> {
    const zones = await this.getAllZones();
    return zones.find((z) => z.id === idOrCode || (z as any).code === idOrCode) ?? null;
  }

  async getNearbyZones(lat: number, lng: number): Promise<Zone[]> {
    const { data, error } = await supabase.rpc("get_zone_for_point", {
      p_lat: lat,
      p_lng: lng,
    });

    if (error || !data || data.length === 0) {
      return this.getAllZones();
    }

    const matchedZone = await this.getZoneById(data[0].code || data[0].id);
    return matchedZone ? [matchedZone] : this.getAllZones();
  }

  async getLatestObservation(zoneIdOrCode: string): Promise<CrowdObservation | null> {
    const { data: zone } = await supabase
      .from("zones")
      .select("id, code")
      .or(`id.eq.${zoneIdOrCode},code.eq.${zoneIdOrCode}`)
      .single();

    if (!zone) return null;

    const { data: obs, error } = await supabase
      .from("crowd_observations")
      .select("*")
      .eq("zone_id", zone.id)
      .order("observed_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !obs) return null;
    return obs as CrowdObservation;
  }

  async getZoneTrend(zoneIdOrCode: string): Promise<Trend> {
    const obs = await this.getLatestObservation(zoneIdOrCode);
    return obs ? obs.trend : "STABLE";
  }

  async setZoneCrowd(zoneIdOrCode: string, crowd: CrowdLevel): Promise<boolean> {
    const { data: zone } = await supabase
      .from("zones")
      .select("id")
      .or(`id.eq.${zoneIdOrCode},code.eq.${zoneIdOrCode}`)
      .single();

    if (!zone) return false;

    // Non-destructive: insert new operational observation
    const { error } = await supabase.from("crowd_observations").insert({
      zone_id: zone.id,
      crowd_level: crowd,
      trend: crowd === "PEAK" || crowd === "HIGH" ? "INCREASING" : "STABLE",
      confidence: "HIGH",
      observed_at: new Date().toISOString(),
      source: "OPERATOR",
      verified: true,
    });

    return !error;
  }
}

/* -------------------------- Supabase Food Repository ------------------------- */

export class SupabaseFoodRepository implements FoodRepository {
  async getAllKitchens(): Promise<Kitchen[]> {
    const { data: kitchens, error } = await supabase
      .from("kitchens")
      .select(`
        id, code, name, zone_id, operator, latitude, longitude, address, capacity, contact_person, contact_phone, status,
        zones ( code ),
        food_observations (
          meals_available, estimated_demand, queue_minutes, status, observed_at
        )
      `)
      .order("code", { ascending: true });

    if (error || !kitchens || kitchens.length === 0) {
      return seedKitchens;
    }

    return kitchens.map((k: any) => {
      const obs = Array.isArray(k.food_observations) && k.food_observations.length > 0
        ? k.food_observations.sort((a: any, b: any) => new Date(b.observed_at).getTime() - new Date(a.observed_at).getTime())[0]
        : null;

      const observedAt = obs?.observed_at ? new Date(obs.observed_at).getTime() : Date.now();
      const updatedMinutesAgo = Math.max(0, Math.round((Date.now() - observedAt) / 60000));

      return {
        id: k.code || k.id,
        name: k.name,
        zoneId: k.zones?.code || k.zone_id,
        operator: k.operator,
        mealsAvailable: obs?.meals_available ?? 2000,
        estimatedDemand: obs?.estimated_demand ?? 2000,
        status: (obs?.status || k.status || "STABLE") as OpStatus,
        quality: updatedMinutesAgo < 5 ? "LIVE" : "VERIFIED",
        updatedMinutesAgo,
        capacity: k.capacity,
        contactPerson: k.contact_person,
        contactPhone: k.contact_phone,
        point: {
          x: 50,
          y: 50,
          lat: Number(k.latitude),
          lng: Number(k.longitude),
        },
      };
    });
  }

  async getKitchenById(idOrCode: string): Promise<Kitchen | null> {
    const kitchens = await this.getAllKitchens();
    return kitchens.find((k) => k.id === idOrCode || (k as any).code === idOrCode) ?? null;
  }

  async getNearbyKitchens(lat: number, lng: number, radiusMeters = 2000): Promise<Kitchen[]> {
    const { data, error } = await supabase.rpc("find_nearby_food", {
      p_lat: lat,
      p_lng: lng,
      p_radius_meters: radiusMeters,
    });

    if (error || !data) {
      return this.getAllKitchens();
    }

    return data.map((k: any) => ({
      id: k.code || k.id,
      name: k.name,
      zoneId: "Z04",
      operator: k.operator,
      mealsAvailable: k.meals_available,
      estimatedDemand: k.meals_available + 200,
      status: (k.status || "STABLE") as OpStatus,
      quality: "LIVE",
      updatedMinutesAgo: 2,
      point: { x: 50, y: 50, lat: Number(k.latitude), lng: Number(k.longitude) },
    }));
  }

  async getAvailableKitchens(zoneId?: string): Promise<Kitchen[]> {
    const all = await this.getAllKitchens();
    return all.filter((k) => k.status !== "CLOSED" && (!zoneId || k.zoneId === zoneId));
  }

  async getLatestObservation(kitchenIdOrCode: string): Promise<FoodObservation | null> {
    const { data: kitchen } = await supabase
      .from("kitchens")
      .select("id")
      .or(`id.eq.${kitchenIdOrCode},code.eq.${kitchenIdOrCode}`)
      .single();

    if (!kitchen) return null;

    const { data: obs } = await supabase
      .from("food_observations")
      .select("*")
      .eq("kitchen_id", kitchen.id)
      .order("observed_at", { ascending: false })
      .limit(1)
      .single();

    return obs as FoodObservation | null;
  }

  async getAllShortages(): Promise<Shortage[]> {
    const { data: shortages, error } = await supabase
      .from("shortages")
      .select(`
        id, code, meals_required, severity, verification, cost_per_meal, funds_raised, target_funds, verified_by, verification_notes, reported_at, updated_at,
        kitchens ( code ),
        zones ( code )
      `)
      .order("reported_at", { ascending: false });

    if (error || !shortages || shortages.length === 0) {
      return seedShortages;
    }

    return shortages.map((s: any) => ({
      id: s.code || s.id,
      kitchenId: s.kitchens?.code || s.kitchen_id,
      zoneId: s.zones?.code || s.zone_id,
      mealsRequired: s.meals_required,
      severity: s.severity,
      verification: s.verification,
      reportedMinutesAgo: Math.max(0, Math.round((Date.now() - new Date(s.reported_at).getTime()) / 60000)),
      updatedMinutesAgo: Math.max(0, Math.round((Date.now() - new Date(s.updated_at).getTime()) / 60000)),
      costPerMeal: Number(s.cost_per_meal) || 35,
      fundsRaised: Number(s.funds_raised) || 0,
      targetFunds: Number(s.target_funds) || s.meals_required * 35,
      verifiedBy: s.verified_by,
      verificationNotes: s.verification_notes,
    }));
  }

  async getShortageById(idOrCode: string): Promise<Shortage | null> {
    const shortages = await this.getAllShortages();
    return shortages.find((s) => s.id === idOrCode || (s as any).code === idOrCode) ?? null;
  }

  async addKitchen(kitchen: Kitchen): Promise<Kitchen> {
    const { error } = await supabase.from("kitchens").insert({
      code: kitchen.id,
      name: kitchen.name,
      operator: kitchen.operator,
      latitude: kitchen.point.lat || 20.0075,
      longitude: kitchen.point.lng || 73.7915,
      capacity: kitchen.capacity || 4000,
      contact_person: kitchen.contactPerson,
      contact_phone: kitchen.contactPhone,
      status: kitchen.status,
    });

    if (error) console.error("[SupabaseFoodRepository] Error adding kitchen:", error);
    return kitchen;
  }

  async updateKitchenStock(idOrCode: string, mealsAvailable: number): Promise<boolean> {
    const { data: kitchen } = await supabase
      .from("kitchens")
      .select("id, capacity")
      .or(`id.eq.${idOrCode},code.eq.${idOrCode}`)
      .single();

    if (!kitchen) return false;

    const estimatedDemand = 2000;
    const status: OpStatus = mealsAvailable >= estimatedDemand
      ? "STABLE"
      : mealsAvailable >= estimatedDemand * 0.85
        ? "WARNING"
        : "CRITICAL";

    const { error } = await supabase.from("food_observations").insert({
      kitchen_id: kitchen.id,
      meals_available: mealsAvailable,
      estimated_demand: estimatedDemand,
      status,
      observed_at: new Date().toISOString(),
      source: "OPERATOR",
      verified: true,
    });

    return !error;
  }

  async updateKitchenRegistry(
    idOrCode: string,
    details: {
      name?: string;
      operator?: string;
      capacity?: number;
      contactPerson?: string;
      contactPhone?: string;
    }
  ): Promise<boolean> {
    const patch: any = {};
    if (details.name) patch.name = details.name;
    if (details.operator) patch.operator = details.operator;
    if (details.capacity) patch.capacity = details.capacity;
    if (details.contactPerson) patch.contact_person = details.contactPerson;
    if (details.contactPhone) patch.contact_phone = details.contactPhone;

    const { error } = await supabase
      .from("kitchens")
      .update(patch)
      .or(`id.eq.${idOrCode},code.eq.${idOrCode}`);

    return !error;
  }

  async closeKitchen(idOrCode: string): Promise<boolean> {
    const { error } = await supabase
      .from("kitchens")
      .update({ status: "CLOSED", updated_at: new Date().toISOString() })
      .or(`id.eq.${idOrCode},code.eq.${idOrCode}`);

    return !error;
  }

  async flagShortage(shortage: {
    kitchenId: string;
    zoneId: string;
    mealsRequired: number;
    severity: OpStatus;
    verifiedBy: string;
    verificationNotes: string;
  }): Promise<Shortage> {
    const code = `SH-${Math.floor(1000 + Math.random() * 9000)}`;
    const costPerMeal = 35;
    const targetFunds = shortage.mealsRequired * costPerMeal;

    const { data: kitchen } = await supabase
      .from("kitchens")
      .select("id")
      .or(`id.eq.${shortage.kitchenId},code.eq.${shortage.kitchenId}`)
      .single();

    const { error } = await supabase.from("shortages").insert({
      code,
      kitchen_id: kitchen?.id || shortage.kitchenId,
      meals_required: shortage.mealsRequired,
      severity: shortage.severity,
      verification: "VERIFIED",
      cost_per_meal: costPerMeal,
      funds_raised: 0,
      target_funds: targetFunds,
      verified_by: shortage.verifiedBy,
      verification_notes: shortage.verificationNotes,
    });

    if (error) console.error("[SupabaseFoodRepository] Error flagging shortage:", error);

    return {
      id: code,
      kitchenId: shortage.kitchenId,
      zoneId: shortage.zoneId,
      mealsRequired: shortage.mealsRequired,
      severity: shortage.severity,
      verification: "VERIFIED",
      reportedMinutesAgo: 0,
      updatedMinutesAgo: 0,
      costPerMeal,
      fundsRaised: 0,
      targetFunds,
      verifiedBy: shortage.verifiedBy,
      verificationNotes: shortage.verificationNotes,
    };
  }

  async verifyShortage(id: string): Promise<boolean> {
    const { error } = await supabase
      .from("shortages")
      .update({ verification: "VERIFIED", updated_at: new Date().toISOString() })
      .or(`id.eq.${id},code.eq.${id}`);

    return !error;
  }

  async donateToShortage(donation: {
    shortageId: string;
    mealsSponsored: number;
    amount: number;
    donorName: string;
    paymentMethod?: "UPI" | "CARD" | "NETBANKING";
    anonymous?: boolean;
  }): Promise<boolean> {
    const { data: shortage } = await supabase
      .from("shortages")
      .select("id, kitchen_id, funds_raised, target_funds")
      .or(`id.eq.${donation.shortageId},code.eq.${donation.shortageId}`)
      .single();

    if (!shortage) return false;

    // Insert donation
    await supabase.from("food_donations").insert({
      shortage_id: shortage.id,
      kitchen_id: shortage.kitchen_id,
      donor_name: donation.donorName,
      meals_sponsored: donation.mealsSponsored,
      amount: donation.amount,
      payment_method: donation.paymentMethod || "UPI",
      anonymous: Boolean(donation.anonymous),
    });

    // Update shortage funds
    const newFunds = Number(shortage.funds_raised || 0) + donation.amount;
    const isFulfilled = newFunds >= Number(shortage.target_funds);

    await supabase
      .from("shortages")
      .update({
        funds_raised: newFunds,
        verification: isFulfilled ? "FULFILLED" : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", shortage.id);

    return true;
  }
}

/* ------------------------- Supabase Parking Repository ------------------------ */

export class SupabaseParkingRepository implements ParkingRepository {
  async getAllParkingLots(): Promise<ParkingLot[]> {
    const { data: lots, error } = await supabase
      .from("parking")
      .select(`
        id, code, name, zone_id, latitude, longitude, capacity, nearest_ghat, walking_km, walking_minutes, status,
        zones ( code ),
        parking_observations (
          available_spaces, occupied_spaces, occupancy_percent, trend, status, observed_at
        )
      `)
      .order("code", { ascending: true });

    if (error || !lots || lots.length === 0) {
      return seedParkingLots;
    }

    return lots.map((p: any) => {
      const obs = Array.isArray(p.parking_observations) && p.parking_observations.length > 0
        ? p.parking_observations.sort((a: any, b: any) => new Date(b.observed_at).getTime() - new Date(a.observed_at).getTime())[0]
        : null;

      const observedAt = obs?.observed_at ? new Date(obs.observed_at).getTime() : Date.now();
      const updatedMinutesAgo = Math.max(0, Math.round((Date.now() - observedAt) / 60000));

      return {
        id: p.code || p.id,
        name: p.name,
        zoneId: p.zones?.code || p.zone_id,
        capacity: p.capacity,
        occupied: obs?.occupied_spaces ?? Math.round(p.capacity * 0.6),
        trend: (obs?.trend || "STABLE") as Trend,
        status: (obs?.status === "FULL" ? "FULL" : p.status) as any,
        nearestGhat: p.nearest_ghat || "Ramkund Ghat",
        walkingKm: Number(p.walking_km) || 1.2,
        walkingMinutes: p.walking_minutes || 15,
        updatedMinutesAgo,
        point: {
          x: 50,
          y: 50,
          lat: Number(p.latitude),
          lng: Number(p.longitude),
        },
      };
    });
  }

  async getParkingLotById(idOrCode: string): Promise<ParkingLot | null> {
    const lots = await this.getAllParkingLots();
    return lots.find((p) => p.id === idOrCode || (p as any).code === idOrCode) ?? null;
  }

  async getNearbyParkingLots(lat: number, lng: number, radiusMeters = 2500): Promise<ParkingLot[]> {
    const { data, error } = await supabase.rpc("find_nearby_parking", {
      p_lat: lat,
      p_lng: lng,
      p_radius_meters: radiusMeters,
    });

    if (error || !data) {
      return this.getAllParkingLots();
    }

    return data.map((p: any) => ({
      id: p.code || p.id,
      name: p.name,
      zoneId: "Z04",
      capacity: p.capacity,
      occupied: p.capacity - p.available_spaces,
      trend: "STABLE" as Trend,
      status: p.status as any,
      nearestGhat: p.nearest_ghat || "Ghat",
      walkingKm: 1.0,
      walkingMinutes: 12,
      updatedMinutesAgo: 1,
      point: { x: 50, y: 50, lat: Number(p.latitude), lng: Number(p.longitude) },
    }));
  }

  async getBestParkingLot(destLat: number, destLng: number, criteria = "balanced"): Promise<ParkingLot | null> {
    const nearby = await this.getNearbyParkingLots(destLat, destLng, 4000);
    const available = nearby.filter((p) => p.status === "OPEN" || p.status === "AVAILABLE" as any);
    if (available.length === 0) return nearby[0] ?? null;

    if (criteria === "distance") {
      return [...available].sort((a, b) => a.walkingKm - b.walkingKm)[0] ?? null;
    }
    return [...available].sort((a, b) => (a.occupied / a.capacity) - (b.occupied / b.capacity))[0] ?? null;
  }

  async getLatestObservation(parkingIdOrCode: string): Promise<ParkingObservation | null> {
    const { data: parking } = await supabase
      .from("parking")
      .select("id")
      .or(`id.eq.${parkingIdOrCode},code.eq.${parkingIdOrCode}`)
      .single();

    if (!parking) return null;

    const { data: obs } = await supabase
      .from("parking_observations")
      .select("*")
      .eq("parking_id", parking.id)
      .order("observed_at", { ascending: false })
      .limit(1)
      .single();

    return obs as ParkingObservation | null;
  }

  async addParkingLot(lot: ParkingLot): Promise<ParkingLot> {
    await supabase.from("parking").insert({
      code: lot.id,
      name: lot.name,
      capacity: lot.capacity,
      nearest_ghat: lot.nearestGhat,
      walking_km: lot.walkingKm,
      walking_minutes: lot.walkingMinutes,
      latitude: lot.point.lat || 20.0,
      longitude: lot.point.lng || 73.8,
      status: lot.status,
    });
    return lot;
  }

  async updateOccupancy(idOrCode: string, occupied: number): Promise<boolean> {
    const { data: parking } = await supabase
      .from("parking")
      .select("id, capacity")
      .or(`id.eq.${idOrCode},code.eq.${idOrCode}`)
      .single();

    if (!parking) return false;

    const occupancyPercent = Math.round((occupied / parking.capacity) * 100);
    const { error } = await supabase.from("parking_observations").insert({
      parking_id: parking.id,
      available_spaces: Math.max(0, parking.capacity - occupied),
      occupied_spaces: occupied,
      occupancy_percent: occupancyPercent,
      trend: "STABLE",
      status: occupancyPercent >= 98 ? "FULL" : occupancyPercent >= 85 ? "LIMITED" : "AVAILABLE",
      observed_at: new Date().toISOString(),
      source: "OPERATOR",
      verified: true,
    });

    return !error;
  }

  async setStatus(idOrCode: string, status: ParkingLot["status"]): Promise<boolean> {
    const { error } = await supabase
      .from("parking")
      .update({ status })
      .or(`id.eq.${idOrCode},code.eq.${idOrCode}`);

    return !error;
  }

  async simulateSurge(idOrCode: string, surge: boolean): Promise<boolean> {
    const target = await this.getParkingLotById(idOrCode);
    if (!target) return false;
    return this.updateOccupancy(idOrCode, surge ? Math.round(target.capacity * 0.96) : Math.round(target.capacity * 0.6));
  }
}

/* ------------------------ Supabase Facility Repository ----------------------- */

export class SupabaseFacilityRepository implements FacilityRepository {
  async getAllFacilities(): Promise<Facility[]> {
    const { data: facilities, error } = await supabase
      .from("facilities")
      .select(`
        id, code, name, zone_id, type, latitude, longitude, capacity, accessible, status, last_inspection,
        zones ( code ),
        facility_observations (
          status, queue_level, wait_minutes, observed_at
        )
      `)
      .order("code", { ascending: true });

    if (error || !facilities || facilities.length === 0) {
      return seedFacilities;
    }

    return facilities.map((f: any) => {
      const obs = Array.isArray(f.facility_observations) && f.facility_observations.length > 0
        ? f.facility_observations.sort((a: any, b: any) => new Date(b.observed_at).getTime() - new Date(a.observed_at).getTime())[0]
        : null;

      const observedAt = obs?.observed_at ? new Date(obs.observed_at).getTime() : Date.now();
      const updatedMinutesAgo = Math.max(0, Math.round((Date.now() - observedAt) / 60000));

      return {
        id: f.code || f.id,
        name: f.name,
        type: f.type as any,
        zoneId: f.zones?.code || f.zone_id,
        status: (obs?.status || f.status || "OPEN") as any,
        queue: (obs?.queue_level || "LOW") as CrowdLevel,
        waitMinutes: obs?.wait_minutes ?? 2,
        capacity: f.capacity,
        accessible: f.accessible,
        lastInspection: f.last_inspection ? new Date(f.last_inspection).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Today",
        updatedMinutesAgo,
        point: {
          x: 50,
          y: 50,
          lat: Number(f.latitude),
          lng: Number(f.longitude),
        },
      };
    });
  }

  async getFacilityById(idOrCode: string): Promise<Facility | null> {
    const all = await this.getAllFacilities();
    return all.find((f) => f.id === idOrCode || (f as any).code === idOrCode) ?? null;
  }

  async getNearbyFacilities(lat: number, lng: number, type?: Facility["type"], radiusMeters = 1000): Promise<Facility[]> {
    const { data, error } = await supabase.rpc("find_nearby_facilities", {
      p_lat: lat,
      p_lng: lng,
      p_radius_meters: radiusMeters,
      p_type: type || null,
    });

    if (error || !data) {
      return this.getAllFacilities();
    }

    return data.map((f: any) => ({
      id: f.code || f.id,
      name: f.name,
      type: f.type,
      zoneId: "Z04",
      status: f.status,
      queue: f.queue_level,
      waitMinutes: f.wait_minutes,
      capacity: 50,
      accessible: f.accessible,
      lastInspection: "Recent",
      updatedMinutesAgo: 1,
      point: { x: 50, y: 50, lat: Number(f.latitude), lng: Number(f.longitude) },
    }));
  }

  async getBestFacility(lat: number, lng: number, type: Facility["type"]): Promise<Facility | null> {
    const nearby = await this.getNearbyFacilities(lat, lng, type, 2000);
    const openOnes = nearby.filter((f) => f.status === "OPEN");
    if (openOnes.length === 0) return nearby[0] ?? null;
    return [...openOnes].sort((a, b) => a.waitMinutes - b.waitMinutes)[0] ?? null;
  }

  async getLatestObservation(facilityIdOrCode: string): Promise<FacilityObservation | null> {
    const { data: fac } = await supabase
      .from("facilities")
      .select("id")
      .or(`id.eq.${facilityIdOrCode},code.eq.${facilityIdOrCode}`)
      .single();

    if (!fac) return null;

    const { data: obs } = await supabase
      .from("facility_observations")
      .select("*")
      .eq("facility_id", fac.id)
      .order("observed_at", { ascending: false })
      .limit(1)
      .single();

    return obs as FacilityObservation | null;
  }

  async addFacility(facility: Facility): Promise<Facility> {
    await supabase.from("facilities").insert({
      code: facility.id,
      name: facility.name,
      type: facility.type,
      capacity: facility.capacity,
      accessible: facility.accessible,
      status: facility.status,
      latitude: facility.point.lat || 20.0,
      longitude: facility.point.lng || 73.8,
    });
    return facility;
  }

  async setStatus(idOrCode: string, status: Facility["status"]): Promise<boolean> {
    const { error } = await supabase
      .from("facilities")
      .update({ status })
      .or(`id.eq.${idOrCode},code.eq.${idOrCode}`);

    return !error;
  }

  async updateQueue(idOrCode: string, queue: CrowdLevel, waitMinutes: number): Promise<boolean> {
    const { data: fac } = await supabase
      .from("facilities")
      .select("id")
      .or(`id.eq.${idOrCode},code.eq.${idOrCode}`)
      .single();

    if (!fac) return false;

    const { error } = await supabase.from("facility_observations").insert({
      facility_id: fac.id,
      queue_level: queue,
      wait_minutes: waitMinutes,
      status: "OPEN",
      observed_at: new Date().toISOString(),
      source: "OPERATOR",
      verified: true,
    });

    return !error;
  }

  async reportIssue(idOrCode: string, _issue: string): Promise<boolean> {
    return this.setStatus(idOrCode, "NEEDS_ATTENTION");
  }

  async simulateSurge(idOrCode: string, surge: boolean): Promise<boolean> {
    return this.updateQueue(idOrCode, surge ? "HIGH" : "LOW", surge ? 8 : 2);
  }
}

/* ------------------------- Supabase Route Repository ------------------------- */

export class SupabaseRouteRepository implements RouteRepository {
  async getAllRoutes(): Promise<RouteLink[]> {
    const { data: routes, error } = await supabase
      .from("routes")
      .select(`
        id, code, name, from_name, to_name, distance_km, walking_minutes, status,
        route_observations ( status, crowd_level, walking_minutes, observed_at )
      `)
      .order("code", { ascending: true });

    if (error || !routes || routes.length === 0) {
      return seedRoutes;
    }

    return routes.map((r: any) => {
      const obs = Array.isArray(r.route_observations) && r.route_observations.length > 0
        ? r.route_observations.sort((a: any, b: any) => new Date(b.observed_at).getTime() - new Date(a.observed_at).getTime())[0]
        : null;

      const observedAt = obs?.observed_at ? new Date(obs.observed_at).getTime() : Date.now();
      const updatedMinutesAgo = Math.max(0, Math.round((Date.now() - observedAt) / 60000));

      return {
        id: r.code || r.id,
        code: r.code,
        name: r.name,
        from: r.from_name,
        to: r.to_name,
        fromZone: r.from_name,
        toZone: r.to_name,
        status: (obs?.status || r.status || "RECOMMENDED") as RouteStatus,
        crowd: (obs?.crowd_level || "LOW") as CrowdLevel,
        distanceKm: Number(r.distance_km) || 1.0,
        walkingMinutes: obs?.walking_minutes ?? r.walking_minutes,
        walkMinutes: obs?.walking_minutes ?? r.walking_minutes,
        updatedMinutesAgo,
        path: [],
      };
    });
  }

  async getRouteById(idOrCode: string): Promise<RouteLink | null> {
    const all = await this.getAllRoutes();
    return all.find((r) => r.id === idOrCode || r.code === idOrCode) ?? null;
  }

  async getNearbyRoutes(_lat: number, _lng: number): Promise<RouteLink[]> {
    return this.getAllRoutes();
  }

  async findBestRoute(fromZone: string, toZone: string): Promise<RouteLink | null> {
    const all = await this.getAllRoutes();
    const matches = all.filter((r) => r.from === fromZone && r.to === toZone);
    return matches[0] ?? all[0] ?? null;
  }

  async getLatestObservation(routeIdOrCode: string): Promise<RouteObservation | null> {
    const { data: r } = await supabase
      .from("routes")
      .select("id")
      .or(`id.eq.${routeIdOrCode},code.eq.${routeIdOrCode}`)
      .single();

    if (!r) return null;

    const { data: obs } = await supabase
      .from("route_observations")
      .select("*")
      .eq("route_id", r.id)
      .order("observed_at", { ascending: false })
      .limit(1)
      .single();

    return obs as RouteObservation | null;
  }

  async setRouteStatus(idOrCode: string, status: RouteStatus): Promise<boolean> {
    const { error } = await supabase
      .from("routes")
      .update({ status })
      .or(`id.eq.${idOrCode},code.eq.${idOrCode}`);

    return !error;
  }
}

/* ------------------------- Supabase Place Repository ------------------------- */

export class SupabasePlaceRepository implements PlaceRepository {
  async getAllPlaces(): Promise<Place[]> {
    const { data, error } = await supabase
      .from("places")
      .select("*")
      .order("code", { ascending: true });

    if (error || !data || data.length === 0) return seedPlaces;

    return data.map((p: any) => ({
      id: p.code || p.id,
      name: p.name,
      category: p.category,
      zoneId: p.zone_id || "Z04",
      published: p.published,
      verification: p.verification,
      updatedMinutesAgo: 10,
      coordinates: `${p.latitude}° N, ${p.longitude}° E`,
      shortDescription: p.short_description || "",
      historicalSignificance: p.historical_significance || "",
      sixtySecondStory: p.sixty_second_story || "",
      culturalContext: p.cultural_context || "",
      visitorInformation: p.visitor_information || "",
      languages: p.languages || ["English", "Hindi", "Marathi"],
      point: { x: 50, y: 50, lat: Number(p.latitude), lng: Number(p.longitude) },
    }));
  }

  async getPlaceById(idOrCode: string): Promise<Place | null> {
    const all = await this.getAllPlaces();
    return all.find((p) => p.id === idOrCode || (p as any).code === idOrCode) ?? null;
  }

  async getNearbyPlaces(lat: number, lng: number, radiusMeters = 3000, category?: Place["category"]): Promise<Place[]> {
    const { data, error } = await supabase.rpc("find_nearby_places", {
      p_lat: lat,
      p_lng: lng,
      p_radius_meters: radiusMeters,
      p_category: category || null,
    });

    if (error || !data) return this.getAllPlaces();

    return data.map((p: any) => ({
      id: p.code || p.id,
      name: p.name,
      category: p.category,
      zoneId: "Z04",
      published: true,
      verification: "VERIFIED",
      updatedMinutesAgo: 5,
      coordinates: `${p.latitude}° N, ${p.longitude}° E`,
      shortDescription: p.short_description || "",
      historicalSignificance: "",
      sixtySecondStory: p.sixty_second_story || "",
      culturalContext: "",
      visitorInformation: "",
      languages: ["English", "Hindi", "Marathi"],
      point: { x: 50, y: 50, lat: Number(p.latitude), lng: Number(p.longitude) },
    }));
  }

  async savePlace(place: Place): Promise<Place> {
    await supabase.from("places").upsert({
      code: place.id,
      name: place.name,
      category: place.category,
      short_description: place.shortDescription,
      historical_significance: place.historicalSignificance,
      sixty_second_story: place.sixtySecondStory,
      published: place.published,
      latitude: place.point.lat || 20.0,
      longitude: place.point.lng || 73.8,
    });
    return place;
  }

  async setPublished(idOrCode: string, published: boolean): Promise<boolean> {
    const { error } = await supabase
      .from("places")
      .update({ published })
      .or(`id.eq.${idOrCode},code.eq.${idOrCode}`);

    return !error;
  }
}

/* ------------------------- Supabase Event Repository ------------------------- */

export class SupabaseEventRepository implements EventRepository {
  async getAllEvents(): Promise<KumbhEvent[]> {
    const { data, error } = await supabase.from("events").select("*").order("date", { ascending: true });
    if (error || !data || data.length === 0) return seedEvents;

    return data.map((e: any) => ({
      id: e.code || e.id,
      code: e.code,
      name: e.name,
      date: e.date,
      start: e.start_time,
      peak: e.peak_time,
      end: e.end_time,
      expectedCrowd: e.expected_crowd,
      affectedZoneIds: e.affected_zones || [],
      published: e.published,
      notes: e.notes || "",
      status: e.status,
    }));
  }

  async getEventById(idOrCode: string): Promise<KumbhEvent | null> {
    const all = await this.getAllEvents();
    return all.find((e) => e.id === idOrCode || e.code === idOrCode) ?? null;
  }

  async saveEvent(event: KumbhEvent): Promise<KumbhEvent> {
    await supabase.from("events").upsert({
      code: event.id,
      name: event.name,
      date: event.date,
      start_time: event.start,
      peak_time: event.peak,
      end_time: event.end,
      expected_crowd: event.expectedCrowd,
      affected_zones: event.affectedZoneIds,
      published: event.published,
      notes: event.notes,
    });
    return event;
  }
}

/* ----------------------- Supabase Advisory Repository ------------------------ */

export class SupabaseAdvisoryRepository implements AdvisoryRepository {
  async getAllAdvisories(): Promise<OpsAlert[]> {
    const { data, error } = await supabase.from("advisories").select("*").order("created_at", { ascending: false });
    if (error || !data || data.length === 0) return seedAlerts;

    return data.map((a: any) => ({
      id: a.code || a.id,
      code: a.code,
      title: a.title,
      message: a.message,
      type: a.type,
      severity: a.severity,
      audience: a.audience || ["PILGRIM"],
      state: a.state,
      createdMinutesAgo: Math.max(0, Math.round((Date.now() - new Date(a.created_at).getTime()) / 60000)),
    }));
  }

  async getActiveAdvisories(_zoneId?: string): Promise<OpsAlert[]> {
    const all = await this.getAllAdvisories();
    return all.filter((a) => a.state === "ACTIVE");
  }

  async createAdvisory(alert: OpsAlert): Promise<OpsAlert> {
    await supabase.from("advisories").insert({
      code: alert.id,
      title: alert.title,
      message: alert.message,
      type: alert.type,
      severity: alert.severity,
      audience: alert.audience,
      state: alert.state,
    });
    return alert;
  }
}

/* ----------------------- Supabase Volunteer Repository ----------------------- */

export class SupabaseVolunteerRepository implements VolunteerRepository {
  async getAllVolunteers(): Promise<Volunteer[]> {
    const { data, error } = await supabase.from("volunteers").select("*");
    if (error || !data || data.length === 0) return seedVolunteers;

    return data.map((v: any) => ({
      id: v.code || v.id,
      code: v.code,
      name: v.name,
      zoneId: v.zone_id || "Z04",
      languages: v.languages || ["English", "Hindi"],
      skills: v.skills || ["Crowd Management"],
      status: v.status,
      assignment: v.assignment,
      lastActiveMinutesAgo: 5,
      point: { x: 50, y: 50, lat: Number(v.latitude) || 20.0, lng: Number(v.longitude) || 73.8 },
    }));
  }

  async getVolunteerById(idOrCode: string): Promise<Volunteer | null> {
    const all = await this.getAllVolunteers();
    return all.find((v) => v.id === idOrCode || v.code === idOrCode) ?? null;
  }

  async assignVolunteer(idOrCode: string, assignment: string): Promise<boolean> {
    const { error } = await supabase
      .from("volunteers")
      .update({ status: "ASSIGNED", assignment })
      .or(`id.eq.${idOrCode},code.eq.${idOrCode}`);

    return !error;
  }

  async setStatus(idOrCode: string, status: Volunteer["status"]): Promise<boolean> {
    const { error } = await supabase
      .from("volunteers")
      .update({ status })
      .or(`id.eq.${idOrCode},code.eq.${idOrCode}`);

    return !error;
  }
}

/* ----------------------------- Guidance Repository ----------------------------- */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDbRule = (r: any): GuidanceRule => ({
  id: r.id,
  code: r.code,
  name: r.name,
  module: r.module,
  conditionMetric: r.condition_metric,
  operator: r.operator,
  thresholdValue: Number(r.threshold_value),
  durationSeconds: r.duration_seconds ?? 0,
  actionType: r.action_type,
  severity: r.severity ?? "WARNING",
  description: r.description,
  enabled: r.enabled ?? true,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDbAutoGuidance = (g: any): AutomatedGuidance => ({
  id: g.id,
  code: g.code,
  ruleId: g.rule_id,
  sourceModule: g.source_module,
  entityType: g.entity_type,
  entityId: g.entity_id,
  title: g.title,
  guidanceText: g.guidance_text,
  reason: g.reason,
  recommendedAction: g.recommended_action,
  status: g.status ?? "ACTIVE",
  confidence: g.confidence ?? "HIGH",
  severity: g.severity ?? "WARNING",
  metricSnapshot: g.metric_snapshot ?? {},
  zoneId: g.zone_id,
  generatedAt: g.generated_at ?? g.created_at ?? new Date().toISOString(),
  expiresAt: g.expires_at,
  dismissedAt: g.dismissed_at,
  dismissedBy: g.dismissed_by,
  promotedAdvisoryId: g.promoted_advisory_id,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDbOverride = (o: any): GuidanceOverride => ({
  id: o.id,
  code: o.code,
  entityType: o.entity_type,
  entityId: o.entity_id,
  overrideType: o.override_type,
  reason: o.reason,
  authorizedBy: o.authorized_by,
  authorityRole: o.authority_role,
  active: o.active ?? true,
  zoneId: o.zone_id,
  expiresAt: o.expires_at,
  createdAt: o.created_at,
  updatedAt: o.updated_at,
});

export class SupabaseGuidanceRepository implements GuidanceRepository {
  // Rules
  async getRules(): Promise<GuidanceRule[]> {
    try {
      const { data, error } = await supabase
        .from("guidance_rules")
        .select("*")
        .order("created_at", { ascending: true });

      if (error || !data?.length) return seedGuidanceRules;
      return data.map(mapDbRule);
    } catch {
      return seedGuidanceRules;
    }
  }

  async getRuleById(idOrCode: string): Promise<GuidanceRule | null> {
    const all = await this.getRules();
    return all.find((r) => r.id === idOrCode || r.code === idOrCode) ?? null;
  }

  async updateRule(id: string, updates: Partial<GuidanceRule>): Promise<GuidanceRule> {
    const patch: Record<string, unknown> = {};
    if (updates.name !== undefined) patch["name"] = updates.name;
    if (updates.thresholdValue !== undefined) patch["threshold_value"] = updates.thresholdValue;
    if (updates.durationSeconds !== undefined) patch["duration_seconds"] = updates.durationSeconds;
    if (updates.enabled !== undefined) patch["enabled"] = updates.enabled;
    if (updates.actionType !== undefined) patch["action_type"] = updates.actionType;
    if (updates.severity !== undefined) patch["severity"] = updates.severity;
    if (updates.description !== undefined) patch["description"] = updates.description;

    const { data, error } = await supabase
      .from("guidance_rules")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) throw new Error(`Failed to update rule ${id}`);
    return mapDbRule(data);
  }

  async toggleRule(id: string, enabled: boolean): Promise<boolean> {
    const { error } = await supabase
      .from("guidance_rules")
      .update({ enabled })
      .eq("id", id);

    return !error;
  }

  // Automated Guidance
  async getAutomatedGuidance(): Promise<AutomatedGuidance[]> {
    try {
      const { data, error } = await supabase
        .from("automated_guidance")
        .select("*")
        .order("generated_at", { ascending: false });

      if (error || !data?.length) return seedAutoGuidance;
      return data.map(mapDbAutoGuidance);
    } catch {
      return seedAutoGuidance;
    }
  }

  async getActiveAutomatedGuidance(): Promise<AutomatedGuidance[]> {
    try {
      const { data, error } = await supabase
        .from("automated_guidance")
        .select("*")
        .eq("status", "ACTIVE")
        .order("generated_at", { ascending: false });

      if (error || !data?.length) return seedAutoGuidance.filter((g) => g.status === "ACTIVE");
      return data.map(mapDbAutoGuidance);
    } catch {
      return seedAutoGuidance.filter((g) => g.status === "ACTIVE");
    }
  }

  async dismissAutomatedGuidance(id: string, dismissedBy: string): Promise<boolean> {
    const { error } = await supabase
      .from("automated_guidance")
      .update({ status: "DISMISSED", dismissed_at: new Date().toISOString(), dismissed_by: dismissedBy })
      .eq("id", id);

    return !error;
  }

  async promoteToVerifiedAdvisory(id: string): Promise<OpsAlert> {
    // Get the guidance item
    const { data: gData } = await supabase
      .from("automated_guidance")
      .select("*")
      .eq("id", id)
      .single();

    const guidance = gData ? mapDbAutoGuidance(gData) : seedAutoGuidance.find((g) => g.id === id);
    if (!guidance) throw new Error(`Automated guidance ${id} not found`);

    // Mark as promoted
    await supabase
      .from("automated_guidance")
      .update({ status: "PROMOTED_TO_VERIFIED" })
      .eq("id", id);

    // Create a verified advisory
    const advisory: OpsAlert = {
      id: `ADV-PROM-${id.slice(0, 8)}`,
      code: `ADV_PROM_${guidance.code}`,
      title: `[VERIFIED] ${guidance.title}`,
      message: guidance.guidanceText,
      type: guidance.sourceModule === "ROUTE" ? "ROUTE" : guidance.sourceModule === "FOOD" ? "FOOD" : guidance.sourceModule === "CROWD" ? "CROWD" : guidance.sourceModule === "FACILITY" ? "FACILITY" : "GENERAL",
      severity: guidance.severity === "CRITICAL" ? "CRITICAL" : guidance.severity === "HIGH" ? "HIGH" : "WARNING",
      audience: ["PILGRIM", "VOLUNTEER", "ADMIN"],
      zoneId: guidance.zoneId,
      state: "ACTIVE",
      createdMinutesAgo: 0,
    };

    // Insert into advisories table
    await supabase.from("advisories").insert({
      code: advisory.code,
      title: advisory.title,
      message: advisory.message,
      type: advisory.type,
      severity: advisory.severity,
      audience: advisory.audience,
      zone_code: advisory.zoneId,
      state: advisory.state,
    });

    return advisory;
  }

  // Overrides
  async getOverrides(): Promise<GuidanceOverride[]> {
    try {
      const { data, error } = await supabase
        .from("guidance_overrides")
        .select("*")
        .order("created_at", { ascending: false });

      if (error || !data?.length) return seedOverrides;
      return data.map(mapDbOverride);
    } catch {
      return seedOverrides;
    }
  }

  async getActiveOverrides(): Promise<GuidanceOverride[]> {
    try {
      const { data, error } = await supabase
        .from("guidance_overrides")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false });

      if (error || !data?.length) return seedOverrides.filter((o) => o.active);
      return data.map(mapDbOverride);
    } catch {
      return seedOverrides.filter((o) => o.active);
    }
  }

  async addOverride(override: GuidanceOverride): Promise<GuidanceOverride> {
    const { data, error } = await supabase
      .from("guidance_overrides")
      .insert({
        code: override.code,
        entity_type: override.entityType,
        entity_id: override.entityId,
        override_type: override.overrideType,
        reason: override.reason,
        authorized_by: override.authorizedBy,
        authority_role: override.authorityRole,
        active: true,
        zone_id: override.zoneId,
        expires_at: override.expiresAt,
      })
      .select()
      .single();

    if (error || !data) return { ...override, id: `GO-${Math.random().toString(36).slice(2, 8)}` };
    return mapDbOverride(data);
  }

  async removeOverride(id: string): Promise<boolean> {
    const { error } = await supabase
      .from("guidance_overrides")
      .update({ active: false })
      .eq("id", id);

    return !error;
  }
}
