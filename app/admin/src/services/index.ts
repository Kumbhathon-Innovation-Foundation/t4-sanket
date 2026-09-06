// PRAVAH (Anubhav) — Domain Services Layer
// Decouples UI / Agent Tools from data access via the multi-mode Repository Layer.
// Operates transparently in both DATA_MODE=demo and DATA_MODE=supabase.

import { delay, getState, mutate } from "@/services/mock/store";
import * as seed from "@/data/mock";
import {
  getCrowdRepository,
  getFoodRepository,
  getParkingRepository,
  getFacilityRepository,
  getRouteRepository,
  getPlaceRepository,
  getEventRepository,
  getAdvisoryRepository,
  getVolunteerRepository,
} from "@/repositories";
import { getActiveGuidanceBoard } from "@/services/guidanceEngine";
import type {
  CrowdLevel,
  DashboardStats,
  Facility,
  FoodDonation,
  Kitchen,
  KumbhEvent,
  OpStatus,
  OpsAlert,
  ParkingLot,
  Place,
  RouteLink,
  RouteStatus,
  Shortage,
  Volunteer,
  Zone,
} from "@/types";

/* ==========================================================================
   1. EXISTING ADMIN READ QUERIES (Preserved 100% for Admin Control Room)
   ========================================================================== */

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const [zones, parking, shortages] = await Promise.all([
    getCrowdRepository().getAllZones(),
    getParkingRepository().getAllParkingLots(),
    getFoodRepository().getAllShortages(),
  ]);

  const capacity = parking.reduce((a, p) => a + p.capacity, 0);
  const occupied = parking.reduce((a, p) => a + p.occupied, 0);

  return {
    activePilgrims: zones.reduce((a, z) => a + z.pilgrims, 0),
    peakZones: zones.filter((z) => z.crowd === "HIGH" || z.crowd === "PEAK").length,
    foodAlerts: shortages.filter((x) => x.verification !== "FULFILLED").length + 7,
    parkingOccupancy: capacity > 0 ? Math.round((occupied / capacity) * 100) : 60,
    activeVolunteers: 284,
    staleReports: 7,
  };
};

export const getCrowdZones = () => getCrowdRepository().getAllZones();
export const getZone = (id: string) => getCrowdRepository().getZoneById(id);

export const getKitchens = () => getFoodRepository().getAllKitchens();
export const getKitchen = (id: string) => getFoodRepository().getKitchenById(id);
export const getShortages = () => getFoodRepository().getAllShortages();

export const getParking = () => getParkingRepository().getAllParkingLots();
export const getParkingLot = (id: string) => getParkingRepository().getParkingLotById(id);

export const getFacilities = () => getFacilityRepository().getAllFacilities();
export const getFacility = (id: string) => getFacilityRepository().getFacilityById(id);

export const getPlaces = () => getPlaceRepository().getAllPlaces();
export const getPlace = (id: string) => getPlaceRepository().getPlaceById(id);

export const getRoutes = () => getRouteRepository().getAllRoutes();
export const getRoute = (id: string) => getRouteRepository().getRouteById(id);

export const getEvents = () => getEventRepository().getAllEvents();
export const getEvent = (id: string) => getEventRepository().getEventById(id);

export const getVolunteers = () => getVolunteerRepository().getAllVolunteers();
export const getVolunteer = (id: string) => getVolunteerRepository().getVolunteerById(id);

export const getAlerts = () => getAdvisoryRepository().getAllAdvisories();
export const getUsers = () => delay(getState().users);
export const getAuditEntries = () => delay(getState().auditEntries);
export const getActivity = () => delay(getState().activityEntries);
export const getRecommendations = () => delay(seed.recommendations);
export const getSeries = () =>
  delay({
    crowd: seed.crowdTrendSeries,
    food: seed.foodSeries,
    parking: seed.parkingSeries,
    facilities: seed.facilitySeries,
    volunteers: seed.volunteerSeries,
  });

/** Everything operationally related to one zone — foundation for Journey Intelligence. */
export const getZoneContext = async (zoneId: string) => {
  const [zone, kitchens, shortages, parking, facilities, routes, volunteers, alerts] =
    await Promise.all([
      getCrowdRepository().getZoneById(zoneId),
      getFoodRepository().getAllKitchens(),
      getFoodRepository().getAllShortages(),
      getParkingRepository().getAllParkingLots(),
      getFacilityRepository().getAllFacilities(),
      getRouteRepository().getAllRoutes(),
      getVolunteerRepository().getAllVolunteers(),
      getAdvisoryRepository().getAllAdvisories(),
    ]);

  return {
    zone,
    kitchens: kitchens.filter((k) => k.zoneId === zoneId),
    shortages: shortages.filter((x) => x.zoneId === zoneId),
    parking: parking.filter((p) => p.zoneId === zoneId),
    facilities: facilities.filter((f) => f.zoneId === zoneId),
    routes,
    volunteers: volunteers.filter((v) => v.zoneId === zoneId),
    alerts: alerts.filter((a) => a.zoneId === zoneId),
  };
};

/* ==========================================================================
   2. STANDARDIZED DOMAIN SERVICES (Agent-Ready & Cross-Interface)
   ========================================================================== */

/**
 * Crowd Intelligence
 */
export const getCrowdStatus = async (zoneId: string): Promise<CrowdLevel> => {
  const zone = await getCrowdRepository().getZoneById(zoneId);
  return zone ? zone.crowd : "MODERATE";
};

export const getCrowdNearLocation = async (lat: number, lng: number): Promise<Zone[]> => {
  return getCrowdRepository().getNearbyZones(lat, lng);
};

export const getCrowdTrend = async (zoneId: string) => {
  return getCrowdRepository().getZoneTrend(zoneId);
};

/**
 * Food & Kitchen Intelligence
 */
export const findNearbyFood = async (lat: number, lng: number, radiusMeters = 2000): Promise<Kitchen[]> => {
  return getFoodRepository().getNearbyKitchens(lat, lng, radiusMeters);
};

export const findAvailableFood = async (zoneId?: string): Promise<Kitchen[]> => {
  return getFoodRepository().getAvailableKitchens(zoneId);
};

export const getFoodPrice = async (
  kitchenId: string,
  _foodItem?: string
): Promise<{ referencePrice: number; observedPrice: number; description: string }> => {
  const obs = await getFoodRepository().getLatestObservation(kitchenId);
  return {
    referencePrice: obs?.reference_price ?? 0.0,
    observedPrice: obs?.observed_price ?? 0.0,
    description: obs?.food_item || "Standard Annakshetra Mahaprasad",
  };
};

/**
 * Parking Intelligence
 */
export const findNearbyParking = async (lat: number, lng: number, radiusMeters = 2500): Promise<ParkingLot[]> => {
  return getParkingRepository().getNearbyParkingLots(lat, lng, radiusMeters);
};

export const findBestParking = async (
  destinationLat: number,
  destinationLng: number,
  criteria: "distance" | "occupancy" | "balanced" = "balanced"
): Promise<ParkingLot | null> => {
  return getParkingRepository().getBestParkingLot(destinationLat, destinationLng, criteria);
};

export const getParkingStatus = async (parkingId: string): Promise<ParkingLot["status"]> => {
  const lot = await getParkingRepository().getParkingLotById(parkingId);
  return lot ? lot.status : "OPEN";
};

/**
 * Civic Facility Intelligence
 */
export const findNearbyFacility = async (
  lat: number,
  lng: number,
  type?: Facility["type"],
  radiusMeters = 1000
): Promise<Facility[]> => {
  return getFacilityRepository().getNearbyFacilities(lat, lng, type, radiusMeters);
};

export const findBestFacility = async (
  lat: number,
  lng: number,
  type: Facility["type"]
): Promise<Facility | null> => {
  return getFacilityRepository().getBestFacility(lat, lng, type);
};

export const getFacilityStatus = async (facilityId: string) => {
  const obs = await getFacilityRepository().getLatestObservation(facilityId);
  return {
    status: obs?.status ?? "OPEN",
    queue: obs?.queue_level ?? "LOW",
    waitMinutes: obs?.wait_minutes ?? 2,
  };
};

/**
 * Routes & Navigational Intelligence
 */
export const getRouteStatus = async (routeId: string): Promise<RouteStatus> => {
  const r = await getRouteRepository().getRouteById(routeId);
  return r ? r.status : "RECOMMENDED";
};

export const findBestRoute = async (
  fromZone: string,
  toZone: string,
  preference: "fastest" | "least_crowded" | "easiest" = "least_crowded"
): Promise<RouteLink | null> => {
  return getRouteRepository().findBestRoute(fromZone, toZone, preference);
};

/**
 * Cultural Places & Discovery
 */
export const getPlaceInformation = async (placeId: string): Promise<Place | null> => {
  return getPlaceRepository().getPlaceById(placeId);
};

export const findNearbyPlaces = async (
  lat: number,
  lng: number,
  radiusMeters = 3000,
  category?: Place["category"]
): Promise<Place[]> => {
  return getPlaceRepository().getNearbyPlaces(lat, lng, radiusMeters, category);
};

/**
 * Advisories & Broadcast Alerts
 */
export const getActiveAdvisories = async (zoneId?: string): Promise<OpsAlert[]> => {
  return getAdvisoryRepository().getActiveAdvisories(zoneId);
};

/**
 * Journey Engine (Core Agent-Ready Journey Planner)
 * "Better, not merely nearest."
 */
export const findBestJourney = async (request: {
  originLat?: number;
  originLng?: number;
  destinationZone?: string;
  activities?: string[];
  preferences?: string[];
}) => {
  const destZone = request.destinationZone || "Z04";
  const [zone, parking, food, routes, alerts] = await Promise.all([
    getCrowdRepository().getZoneById(destZone),
    getParkingRepository().getBestParkingLot(
      request.originLat || 20.0075,
      request.originLng || 73.7915,
      "balanced"
    ),
    getFoodRepository().getAvailableKitchens(destZone),
    getRouteRepository().getAllRoutes(),
    getAdvisoryRepository().getActiveAdvisories(destZone),
  ]);

  const recommendedKitchen = food[0] || null;
  const connectingRoute = routes.find((r) => r.to === destZone || r.toZone === destZone) || routes[0];

  return {
    destinationZone: zone,
    recommendedParking: parking,
    recommendedFood: recommendedKitchen,
    recommendedRoute: connectingRoute,
    activeAdvisories: alerts,
    estimatedBufferMinutes: 30,
    rationale: `Selected parking ${parking?.name || "P09"} and route ${connectingRoute?.name || "R17"} to minimize high-crowd exposure while ensuring access to food at ${recommendedKitchen?.name || "K07"}.`,
  };
};

/* ==========================================================================
   3. OPERATIONAL MUTATIONS (Preserved 100% for Admin Control Room)
   ========================================================================== */

const logActivity = (module: string, action: string, actor = "Anjali Rane") =>
  mutate((s) => ({
    ...s,
    activityEntries: [
      {
        id: `AC-${Math.random().toString(36).slice(2, 8)}`,
        time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        actor,
        module,
        action,
        status: "COMPLETED" as const,
      },
      ...s.activityEntries,
    ],
  }));

export const updateZoneStatus = async (id: string, crowd: string) => {
  return setZoneCrowd(id, crowd as CrowdLevel);
};

export const setZoneCrowd = async (id: string, crowd: CrowdLevel) => {
  const ok = await getCrowdRepository().setZoneCrowd(id, crowd);
  logActivity("Crowd", `Overrode ${id} crowd status to ${crowd}`);
  return ok;
};

export const addKitchen = async (kitchen: Kitchen) => {
  const result = await getFoodRepository().addKitchen(kitchen);
  logActivity("Food", `Added ${kitchen.id}`);
  return result;
};

export const updateKitchenStock = async (id: string, mealsAvailable: number) => {
  const ok = await getFoodRepository().updateKitchenStock(id, mealsAvailable);
  logActivity("Food", `Updated stock for ${id} to ${mealsAvailable} meals`);
  return ok;
};

export const verifyShortage = async (id: string) => {
  const ok = await getFoodRepository().verifyShortage(id);
  logActivity("Food", `Verified shortage ${id}`);
  return ok;
};

export const closeKitchen = async (id: string) => {
  const ok = await getFoodRepository().closeKitchen(id);
  logActivity("Food", `Marked kitchen ${id} as CLOSED`);
  return ok;
};

export const updateKitchenRegistry = async (
  id: string,
  details: {
    name?: string;
    operator?: string;
    capacity?: number;
    contactPerson?: string;
    contactPhone?: string;
    zoneId?: string;
  }
) => {
  const ok = await getFoodRepository().updateKitchenRegistry(id, details);
  logActivity("Food", `Updated registry record for kitchen ${id}`);
  return ok;
};

export const donateToShortage = async (donation: {
  shortageId: string;
  mealsSponsored: number;
  amount: number;
  donorName: string;
  paymentMethod?: "UPI" | "CARD" | "NETBANKING";
  anonymous?: boolean;
}) => {
  const ok = await getFoodRepository().donateToShortage(donation);
  logActivity(
    "Donations",
    `Received ₹${donation.amount.toLocaleString()} donation (${donation.mealsSponsored} meals) from ${
      donation.anonymous ? "Anonymous Donor" : donation.donorName
    } for shortage ${donation.shortageId}`
  );
  return ok;
};

export const flagNewShortage = async (shortage: {
  kitchenId: string;
  zoneId: string;
  mealsRequired: number;
  severity: OpStatus;
  verifiedBy: string;
  verificationNotes: string;
}) => {
  const created = await getFoodRepository().flagShortage(shortage);
  logActivity(
    "Food",
    `Coordinator ${shortage.verifiedBy} flagged verified shortage ${created.id} at ${shortage.kitchenId}`
  );
  return created;
};

export const addParking = async (lot: ParkingLot) => {
  const result = await getParkingRepository().addParkingLot(lot);
  logActivity("Parking", `Added ${lot.id}`);
  return result;
};

export const updateParkingOccupancy = async (id: string, occupied: number) => {
  const ok = await getParkingRepository().updateOccupancy(id, occupied);
  logActivity("Parking", `Updated occupancy for ${id}`);
  return ok;
};

export const simulateParkingSurge = async (lotId: string, surge: boolean) => {
  const ok = await getParkingRepository().simulateSurge(lotId, surge);
  logActivity(
    "Parking",
    surge
      ? `Simulated surge: ${lotId} crossed 96% occupancy (4,800 / 5,000 bays)`
      : `Reset normal: ${lotId} normalized to 72% occupancy (3,600 / 5,000 bays)`
  );
  return ok;
};

export const setParkingStatus = async (id: string, status: ParkingLot["status"]) => {
  const ok = await getParkingRepository().setStatus(id, status);
  logActivity("Parking", `Set ${id} to ${status}`);
  return ok;
};

export const addFacility = async (facility: Facility) => {
  const result = await getFacilityRepository().addFacility(facility);
  logActivity("Facilities", `Added ${facility.id}`);
  return result;
};

export const setFacilityStatus = async (id: string, status: Facility["status"]) => {
  const ok = await getFacilityRepository().setStatus(id, status);
  logActivity("Facilities", `Set ${id} to ${status.replace("_", " ").toLowerCase()}`);
  return ok;
};

export const updateFacilityQueue = async (
  id: string,
  queue: CrowdLevel,
  waitMinutes: number
) => {
  const ok = await getFacilityRepository().updateQueue(id, queue, waitMinutes);
  logActivity("Facilities", `Updated ${id} queue to ${queue} (~${waitMinutes}m wait)`);
  return ok;
};

export const reportFacilityIssue = async (id: string, issue: string) => {
  const ok = await getFacilityRepository().reportIssue(id, issue);
  logActivity("Facilities", `Issue reported on ${id}: ${issue}`);
  return ok;
};

export const simulateFacilitySurge = async (id: string, surge: boolean) => {
  const ok = await getFacilityRepository().simulateSurge(id, surge);
  logActivity("Facilities", `Simulated surge on ${id}: ${surge ? "8m HIGH QUEUE" : "2m CLEARED"}`);
  return ok;
};

export const savePlace = async (place: Place) => {
  const result = await getPlaceRepository().savePlace(place);
  logActivity("Places", `Saved ${place.name}`);
  return result;
};

export const setPlacePublished = async (id: string, published: boolean) => {
  const ok = await getPlaceRepository().setPublished(id, published);
  logActivity("Places", `${published ? "Published" : "Archived"} ${id}`);
  return ok;
};

export const setRouteStatus = async (id: string, status: RouteStatus) => {
  const ok = await getRouteRepository().setRouteStatus(id, status);
  logActivity("Routes", `Set ${id} to ${status.toLowerCase()}`);
  return ok;
};

export const saveEvent = async (event: KumbhEvent) => {
  const result = await getEventRepository().saveEvent(event);
  logActivity("Events", `Saved ${event.name}`);
  return result;
};

export const assignVolunteer = async (id: string, assignment: string) => {
  const ok = await getVolunteerRepository().assignVolunteer(id, assignment);
  logActivity("Volunteers", `Assigned ${id} to ${assignment}`);
  return ok;
};

export const setVolunteerStatus = async (id: string, status: Volunteer["status"]) => {
  const ok = await getVolunteerRepository().setStatus(id, status);
  logActivity("Volunteers", `Set ${id} to ${status.toLowerCase()}`);
  return ok;
};

export const createAlert = async (alert: OpsAlert) => {
  const result = await getAdvisoryRepository().createAdvisory(alert);
  logActivity("Alerts", `Created alert ${alert.title}`);
  return result;
};

export const updateUser = async (id: string, patch: Partial<import("@/types").AppUser>) => {
  mutate((s) => ({ ...s, users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) }));
  logActivity("Users", `Updated user ${id}`);
  return delay(true, 120);
};

/* ==========================================================================
   4. GUIDANCE ENGINE — Automated Guidance & Decision Resolution
   ========================================================================== */

export {
  getGuidanceRules,
  getGuidanceRule,
  updateGuidanceRule,
  toggleGuidanceRule,
  getAllAutomatedGuidance,
  getActiveAutomatedGuidance,
  dismissGuidance,
  promoteGuidanceToAdvisory,
  getAllOverrides,
  getActiveOverrides,
  addGuidanceOverride,
  removeGuidanceOverride,
  resolveRouteGuidance,
  getActiveGuidanceBoard,
  simulateRouteDecision,
} from "@/services/guidanceEngine";

/* ==========================================================================
   5. ANUBHAV AGENT ENGINE — Multilingual AI Assistant Services
   ========================================================================== */

export {
  queryAnubhavAgent,
  detectLanguage,
  getOrCreateSession,
  updateSession,
  resetSession,
} from "@/services/agentEngine";
export type {
  SupportedLanguage,
  AgentSessionContext,
  AgentResponse,
  StructuredCard,
} from "@/services/agentEngine";

/* ==========================================================================
   6. PRD MVP SHOWCASE — 4 CANONICAL AGENT TOOLS (Section 3)
   ========================================================================== */

/** Tool 1: Route & crowd status, tiered (Verified Advisory / Tactical Override / Automated Guidance) */
export const get_guidance_board = getActiveGuidanceBoard;

/** Tool 2: Parking occupancy and availability */
export const get_parking_status = getParking;

/** Tool 3: Kitchen meals availability & shortage alerts */
export const get_food_availability = async () => {
  const [kitchenList, shortageList] = await Promise.all([getKitchens(), getShortages()]);
  return {
    kitchens: kitchenList,
    shortages: shortageList,
    totalAvailableMeals: kitchenList.reduce((acc, k) => acc + k.mealsAvailable, 0),
  };
};

/** Tool 4: Sanitation & welfare facilities with queue times */
export const get_facility_status = getFacilities;



