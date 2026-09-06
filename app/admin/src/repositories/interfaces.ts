// Repository layer interfaces for PRAVAH (Anubhav)
// Abstract data access contracts shared by DEMO (in-memory) and SUPABASE (PostgreSQL + PostGIS)

import type {
  AutomatedGuidance,
  CrowdLevel,
  CrowdObservation,
  DashboardStats,
  Facility,
  FacilityObservation,
  FoodDonation,
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

export interface CrowdRepository {
  getAllZones(): Promise<Zone[]>;
  getZoneById(idOrCode: string): Promise<Zone | null>;
  getNearbyZones(lat: number, lng: number, radiusMeters?: number): Promise<Zone[]>;
  getLatestObservation(zoneIdOrCode: string): Promise<CrowdObservation | null>;
  getZoneTrend(zoneIdOrCode: string): Promise<Trend>;
  setZoneCrowd(zoneIdOrCode: string, crowd: CrowdLevel): Promise<boolean>;
}

export interface FoodRepository {
  getAllKitchens(): Promise<Kitchen[]>;
  getKitchenById(idOrCode: string): Promise<Kitchen | null>;
  getNearbyKitchens(lat: number, lng: number, radiusMeters?: number): Promise<Kitchen[]>;
  getAvailableKitchens(zoneId?: string): Promise<Kitchen[]>;
  getLatestObservation(kitchenIdOrCode: string): Promise<FoodObservation | null>;
  getAllShortages(): Promise<Shortage[]>;
  getShortageById(idOrCode: string): Promise<Shortage | null>;
  addKitchen(kitchen: Kitchen): Promise<Kitchen>;
  updateKitchenStock(idOrCode: string, mealsAvailable: number): Promise<boolean>;
  updateKitchenRegistry(
    idOrCode: string,
    details: {
      name?: string;
      operator?: string;
      capacity?: number;
      contactPerson?: string;
      contactPhone?: string;
      zoneId?: string;
    }
  ): Promise<boolean>;
  closeKitchen(idOrCode: string): Promise<boolean>;
  flagShortage(shortage: {
    kitchenId: string;
    zoneId: string;
    mealsRequired: number;
    severity: OpStatus;
    verifiedBy: string;
    verificationNotes: string;
  }): Promise<Shortage>;
  verifyShortage(id: string): Promise<boolean>;
  donateToShortage(donation: {
    shortageId: string;
    mealsSponsored: number;
    amount: number;
    donorName: string;
    paymentMethod?: "UPI" | "CARD" | "NETBANKING";
    anonymous?: boolean;
  }): Promise<boolean>;
}

export interface ParkingRepository {
  getAllParkingLots(): Promise<ParkingLot[]>;
  getParkingLotById(idOrCode: string): Promise<ParkingLot | null>;
  getNearbyParkingLots(lat: number, lng: number, radiusMeters?: number): Promise<ParkingLot[]>;
  getBestParkingLot(
    destinationLat: number,
    destinationLng: number,
    criteria?: "distance" | "occupancy" | "balanced"
  ): Promise<ParkingLot | null>;
  getLatestObservation(parkingIdOrCode: string): Promise<ParkingObservation | null>;
  addParkingLot(lot: ParkingLot): Promise<ParkingLot>;
  updateOccupancy(idOrCode: string, occupied: number): Promise<boolean>;
  setStatus(idOrCode: string, status: ParkingLot["status"]): Promise<boolean>;
  simulateSurge(idOrCode: string, surge: boolean): Promise<boolean>;
}

export interface FacilityRepository {
  getAllFacilities(): Promise<Facility[]>;
  getFacilityById(idOrCode: string): Promise<Facility | null>;
  getNearbyFacilities(
    lat: number,
    lng: number,
    type?: Facility["type"],
    radiusMeters?: number
  ): Promise<Facility[]>;
  getBestFacility(
    lat: number,
    lng: number,
    type: Facility["type"]
  ): Promise<Facility | null>;
  getLatestObservation(facilityIdOrCode: string): Promise<FacilityObservation | null>;
  addFacility(facility: Facility): Promise<Facility>;
  setStatus(idOrCode: string, status: Facility["status"]): Promise<boolean>;
  updateQueue(idOrCode: string, queue: CrowdLevel, waitMinutes: number): Promise<boolean>;
  reportIssue(idOrCode: string, issue: string): Promise<boolean>;
  simulateSurge(idOrCode: string, surge: boolean): Promise<boolean>;
}

export interface RouteRepository {
  getAllRoutes(): Promise<RouteLink[]>;
  getRouteById(idOrCode: string): Promise<RouteLink | null>;
  getNearbyRoutes(lat: number, lng: number, radiusMeters?: number): Promise<RouteLink[]>;
  findBestRoute(
    fromZone: string,
    toZone: string,
    preference?: "fastest" | "least_crowded" | "easiest"
  ): Promise<RouteLink | null>;
  getLatestObservation(routeIdOrCode: string): Promise<RouteObservation | null>;
  setRouteStatus(idOrCode: string, status: RouteStatus): Promise<boolean>;
}

export interface PlaceRepository {
  getAllPlaces(): Promise<Place[]>;
  getPlaceById(idOrCode: string): Promise<Place | null>;
  getNearbyPlaces(
    lat: number,
    lng: number,
    radiusMeters?: number,
    category?: Place["category"]
  ): Promise<Place[]>;
  savePlace(place: Place): Promise<Place>;
  setPublished(idOrCode: string, published: boolean): Promise<boolean>;
}

export interface EventRepository {
  getAllEvents(): Promise<KumbhEvent[]>;
  getEventById(idOrCode: string): Promise<KumbhEvent | null>;
  saveEvent(event: KumbhEvent): Promise<KumbhEvent>;
}

export interface AdvisoryRepository {
  getAllAdvisories(): Promise<OpsAlert[]>;
  getActiveAdvisories(zoneId?: string): Promise<OpsAlert[]>;
  createAdvisory(alert: OpsAlert): Promise<OpsAlert>;
}

export interface VolunteerRepository {
  getAllVolunteers(): Promise<Volunteer[]>;
  getVolunteerById(idOrCode: string): Promise<Volunteer | null>;
  assignVolunteer(idOrCode: string, assignment: string): Promise<boolean>;
  setStatus(idOrCode: string, status: Volunteer["status"]): Promise<boolean>;
}

export interface GuidanceRepository {
  // Rules
  getRules(): Promise<GuidanceRule[]>;
  getRuleById(idOrCode: string): Promise<GuidanceRule | null>;
  updateRule(id: string, updates: Partial<GuidanceRule>): Promise<GuidanceRule>;
  toggleRule(id: string, enabled: boolean): Promise<boolean>;

  // Automated Guidance
  getAutomatedGuidance(): Promise<AutomatedGuidance[]>;
  getActiveAutomatedGuidance(): Promise<AutomatedGuidance[]>;
  dismissAutomatedGuidance(id: string, dismissedBy: string): Promise<boolean>;
  promoteToVerifiedAdvisory(id: string): Promise<OpsAlert>;

  // Overrides
  getOverrides(): Promise<GuidanceOverride[]>;
  getActiveOverrides(): Promise<GuidanceOverride[]>;
  addOverride(override: GuidanceOverride): Promise<GuidanceOverride>;
  removeOverride(id: string): Promise<boolean>;
}
