// Demo Repository Implementation for PRAVAH (Anubhav)
// Powered by in-memory reactive store (src/services/mock/store.ts).
// Retains 100% of existing demo behavior, network latency simulation, and mock surge triggers.

import { delay, getState, mutate } from "@/services/mock/store";
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
  guidanceRules as seedRules,
  automatedGuidanceItems as seedAutoGuidance,
  guidanceOverrides as seedOverrides,
  alerts as seedAlerts,
} from "@/data/mock";

/* ----------------------------- Crowd Repository ---------------------------- */

export class DemoCrowdRepository implements CrowdRepository {
  async getAllZones(): Promise<Zone[]> {
    return delay(getState().zones);
  }

  async getZoneById(idOrCode: string): Promise<Zone | null> {
    const s = getState();
    const zone = s.zones.find((z) => z.id === idOrCode || (z as any).code === idOrCode) ?? null;
    return delay(zone);
  }

  async getNearbyZones(_lat: number, _lng: number, _radiusMeters = 2000): Promise<Zone[]> {
    return delay(getState().zones);
  }

  async getLatestObservation(zoneIdOrCode: string): Promise<CrowdObservation | null> {
    const zone = await this.getZoneById(zoneIdOrCode);
    if (!zone) return null;
    return delay({
      id: `OBS-CRW-${zone.id}`,
      zone_id: zone.id,
      crowd_level: zone.crowd,
      density_score: zone.crowd === "PEAK" ? 0.95 : zone.crowd === "HIGH" ? 0.75 : zone.crowd === "MODERATE" ? 0.5 : 0.2,
      estimated_people: zone.pilgrims,
      trend: zone.trend,
      confidence: zone.confidence,
      observed_at: new Date(Date.now() - zone.updatedMinutesAgo * 60000).toISOString(),
      source: "DEMO",
      verified: true,
    });
  }

  async getZoneTrend(zoneIdOrCode: string): Promise<Trend> {
    const zone = await this.getZoneById(zoneIdOrCode);
    return zone ? zone.trend : "STABLE";
  }

  async setZoneCrowd(zoneIdOrCode: string, crowd: CrowdLevel): Promise<boolean> {
    mutate((s) => ({
      ...s,
      zones: s.zones.map((z) =>
        z.id === zoneIdOrCode || (z as any).code === zoneIdOrCode
          ? { ...z, crowd, updatedMinutesAgo: 0 }
          : z
      ),
    }));
    return delay(true, 120);
  }
}

/* ----------------------------- Food Repository ----------------------------- */

export class DemoFoodRepository implements FoodRepository {
  async getAllKitchens(): Promise<Kitchen[]> {
    return delay(getState().kitchens);
  }

  async getKitchenById(idOrCode: string): Promise<Kitchen | null> {
    const k = getState().kitchens.find((item) => item.id === idOrCode || (item as any).code === idOrCode) ?? null;
    return delay(k);
  }

  async getNearbyKitchens(_lat: number, _lng: number, _radiusMeters = 2000): Promise<Kitchen[]> {
    return delay(getState().kitchens);
  }

  async getAvailableKitchens(zoneId?: string): Promise<Kitchen[]> {
    const s = getState();
    const list = s.kitchens.filter((k) => k.status !== "CLOSED" && (!zoneId || k.zoneId === zoneId));
    return delay(list);
  }

  async getLatestObservation(kitchenIdOrCode: string): Promise<FoodObservation | null> {
    const k = await this.getKitchenById(kitchenIdOrCode);
    if (!k) return null;
    return delay({
      id: `OBS-FD-${k.id}`,
      kitchen_id: k.id,
      food_item: "Standard Annakshetra Thali",
      meals_available: k.mealsAvailable,
      estimated_demand: k.estimatedDemand,
      availability: k.mealsAvailable > 500 ? "AVAILABLE" : k.mealsAvailable > 0 ? "LIMITED" : "OUT_OF_STOCK",
      reference_price: 0,
      observed_price: 0,
      queue_minutes: k.status === "CRITICAL" ? 25 : k.status === "WARNING" ? 12 : 4,
      status: k.status,
      observed_at: new Date(Date.now() - k.updatedMinutesAgo * 60000).toISOString(),
      source: "DEMO",
      verified: true,
    });
  }

  async getAllShortages(): Promise<Shortage[]> {
    return delay(getState().shortages);
  }

  async getShortageById(idOrCode: string): Promise<Shortage | null> {
    const s = getState().shortages.find((x) => x.id === idOrCode || (x as any).code === idOrCode) ?? null;
    return delay(s);
  }

  async addKitchen(kitchen: Kitchen): Promise<Kitchen> {
    mutate((s) => ({ ...s, kitchens: [kitchen, ...s.kitchens] }));
    return delay(kitchen, 120);
  }

  async updateKitchenStock(idOrCode: string, mealsAvailable: number): Promise<boolean> {
    mutate((s) => ({
      ...s,
      kitchens: s.kitchens.map((k) =>
        k.id === idOrCode || (k as any).code === idOrCode
          ? {
              ...k,
              mealsAvailable,
              updatedMinutesAgo: 0,
              status:
                mealsAvailable >= k.estimatedDemand
                  ? "STABLE"
                  : mealsAvailable >= k.estimatedDemand * 0.85
                    ? "WARNING"
                    : "CRITICAL",
            }
          : k
      ),
    }));
    return delay(true, 120);
  }

  async updateKitchenRegistry(
    idOrCode: string,
    details: {
      name?: string;
      operator?: string;
      capacity?: number;
      contactPerson?: string;
      contactPhone?: string;
      zoneId?: string;
    }
  ): Promise<boolean> {
    mutate((s) => ({
      ...s,
      kitchens: s.kitchens.map((k) =>
        k.id === idOrCode || (k as any).code === idOrCode
          ? { ...k, ...details, updatedMinutesAgo: 0 }
          : k
      ),
    }));
    return delay(true, 120);
  }

  async closeKitchen(idOrCode: string): Promise<boolean> {
    mutate((s) => ({
      ...s,
      kitchens: s.kitchens.map((k) =>
        k.id === idOrCode || (k as any).code === idOrCode
          ? { ...k, status: "CLOSED", updatedMinutesAgo: 0 }
          : k
      ),
    }));
    return delay(true, 120);
  }

  async flagShortage(shortage: {
    kitchenId: string;
    zoneId: string;
    mealsRequired: number;
    severity: OpStatus;
    verifiedBy: string;
    verificationNotes: string;
  }): Promise<Shortage> {
    const newShortage: Shortage = {
      id: `SH-${Math.floor(1000 + Math.random() * 9000)}`,
      kitchenId: shortage.kitchenId,
      zoneId: shortage.zoneId,
      mealsRequired: shortage.mealsRequired,
      severity: shortage.severity,
      verification: "VERIFIED",
      reportedMinutesAgo: 0,
      updatedMinutesAgo: 0,
      costPerMeal: 35,
      fundsRaised: 0,
      targetFunds: shortage.mealsRequired * 35,
      verifiedBy: shortage.verifiedBy,
      verificationNotes: shortage.verificationNotes,
    };

    mutate((s) => ({
      ...s,
      shortages: [newShortage, ...s.shortages],
    }));
    return delay(newShortage, 120);
  }

  async verifyShortage(id: string): Promise<boolean> {
    mutate((s) => ({
      ...s,
      shortages: s.shortages.map((x) =>
        x.id === id ? { ...x, verification: "VERIFIED", updatedMinutesAgo: 0 } : x
      ),
    }));
    return delay(true, 120);
  }

  async donateToShortage(donation: {
    shortageId: string;
    mealsSponsored: number;
    amount: number;
    donorName: string;
    paymentMethod?: "UPI" | "CARD" | "NETBANKING";
    anonymous?: boolean;
  }): Promise<boolean> {
    let targetKitchenId = "";
    mutate((s) => {
      const updatedShortages = s.shortages.map((shortage) => {
        if (shortage.id === donation.shortageId) {
          targetKitchenId = shortage.kitchenId;
          const newFunds = (shortage.fundsRaised || 0) + donation.amount;
          const target = shortage.targetFunds || shortage.mealsRequired * (shortage.costPerMeal || 35);
          return {
            ...shortage,
            fundsRaised: newFunds,
            verification: (newFunds >= target ? "FULFILLED" : shortage.verification) as any,
            updatedMinutesAgo: 0,
          };
        }
        return shortage;
      });

      const updatedKitchens = s.kitchens.map((k) => {
        if (k.id === targetKitchenId) {
          const nextMeals = k.mealsAvailable + donation.mealsSponsored;
          return {
            ...k,
            mealsAvailable: nextMeals,
            updatedMinutesAgo: 0,
            status: (nextMeals >= k.estimatedDemand
              ? "STABLE"
              : nextMeals >= k.estimatedDemand * 0.85
                ? "WARNING"
                : "CRITICAL") as any,
          };
        }
        return k;
      });

      return {
        ...s,
        shortages: updatedShortages,
        kitchens: updatedKitchens,
      };
    });
    return delay(true, 150);
  }
}

/* ---------------------------- Parking Repository --------------------------- */

export class DemoParkingRepository implements ParkingRepository {
  async getAllParkingLots(): Promise<ParkingLot[]> {
    return delay(getState().parkingLots);
  }

  async getParkingLotById(idOrCode: string): Promise<ParkingLot | null> {
    const lot = getState().parkingLots.find((p) => p.id === idOrCode || (p as any).code === idOrCode) ?? null;
    return delay(lot);
  }

  async getNearbyParkingLots(_lat: number, _lng: number, _radiusMeters = 2500): Promise<ParkingLot[]> {
    return delay(getState().parkingLots);
  }

  async getBestParkingLot(
    _destLat: number,
    _destLng: number,
    criteria = "balanced"
  ): Promise<ParkingLot | null> {
    const lots = getState().parkingLots.filter((p) => p.status === "OPEN");
    if (lots.length === 0) return null;

    if (criteria === "occupancy") {
      return [...lots].sort((a, b) => a.occupied / a.capacity - b.occupied / b.capacity)[0] ?? null;
    }
    if (criteria === "distance") {
      return [...lots].sort((a, b) => a.walkingKm - b.walkingKm)[0] ?? null;
    }
    // "Better, not merely nearest": balanced score of occupancy and distance
    return [...lots].sort((a, b) => {
      const scoreA = (a.occupied / a.capacity) * 0.6 + (a.walkingKm / 3) * 0.4;
      const scoreB = (b.occupied / b.capacity) * 0.6 + (b.walkingKm / 3) * 0.4;
      return scoreA - scoreB;
    })[0] ?? null;
  }

  async getLatestObservation(parkingIdOrCode: string): Promise<ParkingObservation | null> {
    const lot = await this.getParkingLotById(parkingIdOrCode);
    if (!lot) return null;
    const occupancyPercent = Math.round((lot.occupied / lot.capacity) * 100);
    return delay({
      id: `OBS-PRK-${lot.id}`,
      parking_id: lot.id,
      available_spaces: Math.max(0, lot.capacity - lot.occupied),
      occupied_spaces: lot.occupied,
      occupancy_percent: occupancyPercent,
      queue_minutes: occupancyPercent > 90 ? 15 : occupancyPercent > 70 ? 5 : 2,
      trend: lot.trend,
      status: lot.status === "CLOSED" ? "CLOSED" : occupancyPercent >= 98 ? "FULL" : occupancyPercent >= 85 ? "LIMITED" : "AVAILABLE",
      observed_at: new Date(Date.now() - lot.updatedMinutesAgo * 60000).toISOString(),
      source: "DEMO",
      verified: true,
    });
  }

  async addParkingLot(lot: ParkingLot): Promise<ParkingLot> {
    mutate((s) => ({ ...s, parkingLots: [lot, ...s.parkingLots] }));
    return delay(lot, 120);
  }

  async updateOccupancy(idOrCode: string, occupied: number): Promise<boolean> {
    mutate((s) => ({
      ...s,
      parkingLots: s.parkingLots.map((p) =>
        p.id === idOrCode || (p as any).code === idOrCode
          ? {
              ...p,
              occupied,
              updatedMinutesAgo: 0,
              status: occupied >= p.capacity ? "FULL" : p.status,
            }
          : p
      ),
    }));
    return delay(true, 120);
  }

  async setStatus(idOrCode: string, status: ParkingLot["status"]): Promise<boolean> {
    mutate((s) => ({
      ...s,
      parkingLots: s.parkingLots.map((p) =>
        p.id === idOrCode || (p as any).code === idOrCode
          ? { ...p, status, updatedMinutesAgo: 0 }
          : p
      ),
    }));
    return delay(true, 120);
  }

  async simulateSurge(idOrCode: string, surge: boolean): Promise<boolean> {
    mutate((s) => ({
      ...s,
      parkingLots: s.parkingLots.map((p) =>
        p.id === idOrCode || (p as any).code === idOrCode
          ? {
              ...p,
              capacity: 5000,
              occupied: surge ? 4800 : 3600,
              trend: surge ? "INCREASING" : "STABLE",
              status: "OPEN",
              updatedMinutesAgo: 0,
            }
          : p
      ),
    }));
    return delay(true, 120);
  }
}

/* --------------------------- Facility Repository --------------------------- */

export class DemoFacilityRepository implements FacilityRepository {
  async getAllFacilities(): Promise<Facility[]> {
    return delay(getState().facilities);
  }

  async getFacilityById(idOrCode: string): Promise<Facility | null> {
    const f = getState().facilities.find((item) => item.id === idOrCode || (item as any).code === idOrCode) ?? null;
    return delay(f);
  }

  async getNearbyFacilities(
    _lat: number,
    _lng: number,
    type?: Facility["type"],
    _radiusMeters = 1000
  ): Promise<Facility[]> {
    const s = getState();
    const list = type ? s.facilities.filter((f) => f.type === type) : s.facilities;
    return delay(list);
  }

  async getBestFacility(
    lat: number,
    lng: number,
    type: Facility["type"]
  ): Promise<Facility | null> {
    const candidates = await this.getNearbyFacilities(lat, lng, type);
    const operational = candidates.filter((f) => f.status === "OPEN");
    if (operational.length === 0) return candidates[0] ?? null;

    // "Better, not merely nearest": shortest wait time + low queue
    return [...operational].sort((a, b) => a.waitMinutes - b.waitMinutes)[0] ?? null;
  }

  async getLatestObservation(facilityIdOrCode: string): Promise<FacilityObservation | null> {
    const f = await this.getFacilityById(facilityIdOrCode);
    if (!f) return null;
    return delay({
      id: `OBS-FAC-${f.id}`,
      facility_id: f.id,
      status: f.status,
      queue_level: f.queue,
      wait_minutes: f.waitMinutes,
      working_status: f.status === "OPEN" ? "OPERATIONAL" : f.status === "NEEDS_ATTENTION" ? "WATER_PRESSURE_LOW" : "OUT_OF_SERVICE",
      observed_at: new Date(Date.now() - f.updatedMinutesAgo * 60000).toISOString(),
      source: "DEMO",
      verified: true,
    });
  }

  async addFacility(facility: Facility): Promise<Facility> {
    mutate((s) => ({ ...s, facilities: [facility, ...s.facilities] }));
    return delay(facility, 120);
  }

  async setStatus(idOrCode: string, status: Facility["status"]): Promise<boolean> {
    mutate((s) => ({
      ...s,
      facilities: s.facilities.map((f) =>
        f.id === idOrCode || (f as any).code === idOrCode
          ? { ...f, status, updatedMinutesAgo: 0 }
          : f
      ),
    }));
    return delay(true, 120);
  }

  async updateQueue(idOrCode: string, queue: CrowdLevel, waitMinutes: number): Promise<boolean> {
    mutate((s) => ({
      ...s,
      facilities: s.facilities.map((f) =>
        f.id === idOrCode || (f as any).code === idOrCode
          ? { ...f, queue, waitMinutes, updatedMinutesAgo: 0 }
          : f
      ),
    }));
    return delay(true, 120);
  }

  async reportIssue(idOrCode: string, _issue: string): Promise<boolean> {
    mutate((s) => ({
      ...s,
      facilities: s.facilities.map((f) =>
        f.id === idOrCode || (f as any).code === idOrCode
          ? { ...f, status: "NEEDS_ATTENTION", updatedMinutesAgo: 0 }
          : f
      ),
    }));
    return delay(true, 120);
  }

  async simulateSurge(idOrCode: string, surge: boolean): Promise<boolean> {
    mutate((s) => ({
      ...s,
      facilities: s.facilities.map((f) => {
        if (f.id !== idOrCode && (f as any).code !== idOrCode) return f;
        return {
          ...f,
          queue: surge ? "HIGH" : "LOW",
          waitMinutes: surge ? 8 : 2,
          status: surge ? "NEEDS_ATTENTION" : "OPEN",
          updatedMinutesAgo: 0,
        };
      }),
    }));
    return delay(true, 120);
  }
}

/* ----------------------------- Route Repository ---------------------------- */

export class DemoRouteRepository implements RouteRepository {
  async getAllRoutes(): Promise<RouteLink[]> {
    return delay(getState().routeLinks);
  }

  async getRouteById(idOrCode: string): Promise<RouteLink | null> {
    const r = getState().routeLinks.find((item) => item.id === idOrCode || item.code === idOrCode) ?? null;
    return delay(r);
  }

  async getNearbyRoutes(_lat: number, _lng: number, _radiusMeters = 2000): Promise<RouteLink[]> {
    return delay(getState().routeLinks);
  }

  async findBestRoute(
    fromZone: string,
    toZone: string,
    preference: "fastest" | "least_crowded" | "easiest" = "least_crowded"
  ): Promise<RouteLink | null> {
    const routes = getState().routeLinks.filter(
      (r) => (r.from === fromZone || r.fromZone === fromZone) && (r.to === toZone || r.toZone === toZone)
    );
    if (routes.length === 0) return getState().routeLinks[0] ?? null;

    if (preference === "fastest") {
      return [...routes].sort((a, b) => a.walkingMinutes - b.walkingMinutes)[0] ?? null;
    }
    if (preference === "least_crowded") {
      const crowdScore = { LOW: 1, MODERATE: 2, HIGH: 3, PEAK: 4 };
      return [...routes].sort((a, b) => crowdScore[a.crowd] - crowdScore[b.crowd])[0] ?? null;
    }
    return routes[0] ?? null;
  }

  async getLatestObservation(routeIdOrCode: string): Promise<RouteObservation | null> {
    const r = await this.getRouteById(routeIdOrCode);
    if (!r) return null;
    return delay({
      id: `OBS-RT-${r.id}`,
      route_id: r.id,
      status: r.status,
      crowd_level: r.crowd,
      walking_minutes: r.walkingMinutes,
      observed_at: new Date(Date.now() - r.updatedMinutesAgo * 60000).toISOString(),
      source: "DEMO",
      verified: true,
    });
  }

  async setRouteStatus(idOrCode: string, status: RouteStatus): Promise<boolean> {
    mutate((s) => ({
      ...s,
      routeLinks: s.routeLinks.map((r) =>
        r.id === idOrCode || r.code === idOrCode
          ? { ...r, status, updatedMinutesAgo: 0 }
          : r
      ),
    }));
    return delay(true, 120);
  }
}

/* ----------------------------- Place Repository ---------------------------- */

export class DemoPlaceRepository implements PlaceRepository {
  async getAllPlaces(): Promise<Place[]> {
    return delay(getState().places);
  }

  async getPlaceById(idOrCode: string): Promise<Place | null> {
    const p = getState().places.find((item) => item.id === idOrCode || (item as any).code === idOrCode) ?? null;
    return delay(p);
  }

  async getNearbyPlaces(
    _lat: number,
    _lng: number,
    _radiusMeters = 3000,
    category?: Place["category"]
  ): Promise<Place[]> {
    const s = getState();
    const list = category ? s.places.filter((p) => p.category === category) : s.places;
    return delay(list);
  }

  async savePlace(place: Place): Promise<Place> {
    mutate((s) => ({
      ...s,
      places: s.places.some((p) => p.id === place.id)
        ? s.places.map((p) => (p.id === place.id ? { ...place, updatedMinutesAgo: 0 } : p))
        : [{ ...place, updatedMinutesAgo: 0 }, ...s.places],
    }));
    return delay(place, 120);
  }

  async setPublished(idOrCode: string, published: boolean): Promise<boolean> {
    mutate((s) => ({
      ...s,
      places: s.places.map((p) =>
        p.id === idOrCode || (p as any).code === idOrCode
          ? { ...p, published, updatedMinutesAgo: 0 }
          : p
      ),
    }));
    return delay(true, 120);
  }
}

/* ----------------------------- Event Repository ---------------------------- */

export class DemoEventRepository implements EventRepository {
  async getAllEvents(): Promise<KumbhEvent[]> {
    return delay(getState().events);
  }

  async getEventById(idOrCode: string): Promise<KumbhEvent | null> {
    const e = getState().events.find((item) => item.id === idOrCode || item.code === idOrCode) ?? null;
    return delay(e);
  }

  async saveEvent(event: KumbhEvent): Promise<KumbhEvent> {
    mutate((s) => ({
      ...s,
      events: s.events.some((e) => e.id === event.id)
        ? s.events.map((e) => (e.id === event.id ? event : e))
        : [event, ...s.events],
    }));
    return delay(event, 120);
  }
}

/* --------------------------- Advisory Repository --------------------------- */

export class DemoAdvisoryRepository implements AdvisoryRepository {
  async getAllAdvisories(): Promise<OpsAlert[]> {
    return delay(getState().alerts);
  }

  async getActiveAdvisories(zoneId?: string): Promise<OpsAlert[]> {
    const s = getState();
    const active = s.alerts.filter(
      (a) => a.state === "ACTIVE" && (!zoneId || a.zoneId === zoneId)
    );
    return delay(active);
  }

  async createAdvisory(alert: OpsAlert): Promise<OpsAlert> {
    mutate((s) => ({ ...s, alerts: [alert, ...s.alerts] }));
    return delay(alert, 120);
  }
}

/* --------------------------- Volunteer Repository -------------------------- */

export class DemoVolunteerRepository implements VolunteerRepository {
  async getAllVolunteers(): Promise<Volunteer[]> {
    return delay(getState().volunteers);
  }

  async getVolunteerById(idOrCode: string): Promise<Volunteer | null> {
    const v = getState().volunteers.find((item) => item.id === idOrCode || item.code === idOrCode) ?? null;
    return delay(v);
  }

  async assignVolunteer(idOrCode: string, assignment: string): Promise<boolean> {
    mutate((s) => ({
      ...s,
      volunteers: s.volunteers.map((v) =>
        v.id === idOrCode || v.code === idOrCode
          ? { ...v, status: "ASSIGNED", assignment, lastActiveMinutesAgo: 0 }
          : v
      ),
    }));
    return delay(true, 120);
  }

  async setStatus(idOrCode: string, status: Volunteer["status"]): Promise<boolean> {
    mutate((s) => ({
      ...s,
      volunteers: s.volunteers.map((v) =>
        v.id === idOrCode || v.code === idOrCode
          ? { ...v, status, assignment: status === "ASSIGNED" ? v.assignment : undefined }
          : v
      ),
    }));
    return delay(true, 120);
  }
}

/* ----------------------------- Guidance Repository ----------------------------- */

export class DemoGuidanceRepository implements GuidanceRepository {
  private rules = [...seedRules];
  private autoGuidance = [...seedAutoGuidance];
  private overrides = [...seedOverrides];

  // Rules
  async getRules(): Promise<GuidanceRule[]> {
    return delay([...this.rules]);
  }

  async getRuleById(idOrCode: string): Promise<GuidanceRule | null> {
    return delay(this.rules.find((r) => r.id === idOrCode || r.code === idOrCode) ?? null);
  }

  async updateRule(id: string, updates: Partial<GuidanceRule>): Promise<GuidanceRule> {
    const idx = this.rules.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error(`Rule ${id} not found`);
    this.rules[idx] = Object.assign({}, this.rules[idx], updates) as GuidanceRule;
    return delay(Object.assign({}, this.rules[idx]) as GuidanceRule);
  }

  async toggleRule(id: string, enabled: boolean): Promise<boolean> {
    const idx = this.rules.findIndex((r) => r.id === id);
    if (idx === -1) return delay(false);
    this.rules[idx] = Object.assign({}, this.rules[idx], { enabled }) as GuidanceRule;
    return delay(true, 120);
  }

  // Automated Guidance
  async getAutomatedGuidance(): Promise<AutomatedGuidance[]> {
    return delay([...this.autoGuidance]);
  }

  async getActiveAutomatedGuidance(): Promise<AutomatedGuidance[]> {
    return delay(this.autoGuidance.filter((g) => g.status === "ACTIVE"));
  }

  async dismissAutomatedGuidance(id: string, dismissedBy: string): Promise<boolean> {
    const idx = this.autoGuidance.findIndex((g) => g.id === id);
    if (idx === -1) return delay(false);
    this.autoGuidance[idx] = Object.assign({}, this.autoGuidance[idx], {
      status: "DISMISSED" as const,
      dismissedAt: new Date().toISOString(),
      dismissedBy,
    }) as AutomatedGuidance;
    return delay(true, 120);
  }

  async promoteToVerifiedAdvisory(id: string): Promise<OpsAlert> {
    const guidance = this.autoGuidance.find((g) => g.id === id);
    if (!guidance) throw new Error(`Automated guidance ${id} not found`);

    // Mark guidance as promoted
    const idx = this.autoGuidance.findIndex((g) => g.id === id);
    this.autoGuidance[idx] = Object.assign({}, this.autoGuidance[idx], { status: "PROMOTED_TO_VERIFIED" as const }) as AutomatedGuidance;

    // Create a new verified advisory
    const advisory: OpsAlert = {
      id: `ADV-PROM-${id}`,
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

    // Add to the mock alerts
    mutate((s) => ({
      ...s,
      alerts: [advisory, ...s.alerts],
    }));

    return delay(advisory, 120);
  }

  // Overrides
  async getOverrides(): Promise<GuidanceOverride[]> {
    return delay([...this.overrides]);
  }

  async getActiveOverrides(): Promise<GuidanceOverride[]> {
    return delay(this.overrides.filter((o) => o.active));
  }

  async addOverride(override: GuidanceOverride): Promise<GuidanceOverride> {
    const newOverride = { ...override, id: override.id || `GO-${Math.random().toString(36).slice(2, 8)}`, createdAt: new Date().toISOString() };
    this.overrides.push(newOverride);
    return delay(newOverride, 120);
  }

  async removeOverride(id: string): Promise<boolean> {
    const idx = this.overrides.findIndex((o) => o.id === id);
    if (idx === -1) return delay(false);
    this.overrides[idx] = Object.assign({}, this.overrides[idx], { active: false }) as GuidanceOverride;
    return delay(true, 120);
  }
}
