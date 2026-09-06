// Domain types for the Anubhav Operations Control Room.
// Phase 1: consumed by mock services; Phase 2 will be reused by real API services.

export type CrowdLevel = "LOW" | "MODERATE" | "HIGH" | "PEAK";
export type OpStatus = "STABLE" | "WARNING" | "CRITICAL" | "CLOSED";
export type DataQuality =
  | "LIVE"
  | "VERIFIED"
  | "ESTIMATED"
  | "PREDICTED"
  | "STALE"
  | "SIMULATED";
export type Trend = "INCREASING" | "STABLE" | "DECREASING";
export type Confidence = "HIGH" | "MEDIUM" | "LOW";

/** Normalised 0-100 coordinate space used by the Phase 1 map surface. */
export interface GeoPoint {
  x: number;
  y: number;
  lat?: number;
  lng?: number;
}

export interface Zone {
  id: string;
  name: string;
  area: string;
  crowd: CrowdLevel;
  trend: Trend;
  reports: number;
  confidence: Confidence;
  quality: DataQuality;
  updatedMinutesAgo: number;
  pilgrims: number;
  shape: GeoPoint[];
  center: GeoPoint;
}

export interface Kitchen {
  id: string;
  name: string;
  zoneId: string;
  operator: string;
  mealsAvailable: number;
  estimatedDemand: number;
  status: OpStatus;
  quality: DataQuality;
  updatedMinutesAgo: number;
  point: GeoPoint;
  capacity?: number;
  contactPerson?: string;
  contactPhone?: string;
}

export type ShortageVerification = "PENDING" | "VERIFIED" | "FULFILLED";

export interface Shortage {
  id: string;
  kitchenId: string;
  zoneId: string;
  mealsRequired: number;
  severity: OpStatus;
  verification: ShortageVerification;
  reportedMinutesAgo: number;
  updatedMinutesAgo: number;
  costPerMeal?: number;
  fundsRaised?: number;
  targetFunds?: number;
  verifiedBy?: string;
  verificationNotes?: string;
}

export interface FoodDonation {
  id: string;
  shortageId: string;
  kitchenId: string;
  donorName: string;
  mealsSponsored: number;
  amount: number;
  timestamp: string;
  paymentMethod: "UPI" | "CARD" | "NETBANKING";
  anonymous: boolean;
}

export interface ParkingLot {
  id: string;
  name: string;
  zoneId: string;
  capacity: number;
  occupied: number;
  trend: Trend;
  status: "OPEN" | "FULL" | "CLOSED";
  nearestGhat: string;
  walkingKm: number;
  walkingMinutes: number;
  updatedMinutesAgo: number;
  point: GeoPoint;
}

export type FacilityType = "TOILET" | "WATER" | "MEDICAL" | "HELP" | "REST";

export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  zoneId: string;
  status: "OPEN" | "NEEDS_ATTENTION" | "CLOSED";
  queue: CrowdLevel;
  waitMinutes: number;
  capacity: number;
  accessible: boolean;
  lastInspection: string;
  updatedMinutesAgo: number;
  point: GeoPoint;
}

export type PlaceCategory =
  | "GHAT"
  | "TEMPLE"
  | "HISTORIC"
  | "AKHARA"
  | "CULTURAL"
  | "OTHER";

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  zoneId: string;
  published: boolean;
  verification: "VERIFIED" | "PENDING";
  updatedMinutesAgo: number;
  coordinates: string;
  shortDescription: string;
  historicalSignificance: string;
  sixtySecondStory: string;
  culturalContext: string;
  visitorInformation: string;
  languages: string[];
  point: GeoPoint;
}

export type RouteStatus = "RECOMMENDED" | "CONGESTED" | "CLOSED" | "DIVERSION";

export interface RouteLink {
  id: string;
  code?: string;
  name?: string;
  from: string;
  to: string;
  fromZone?: string;
  toZone?: string;
  status: RouteStatus;
  crowd: CrowdLevel;
  distanceKm: number;
  walkingMinutes: number;
  walkMinutes?: number;
  alternativeRouteId?: string;
  updatedMinutesAgo: number;
  path: GeoPoint[];
}

export interface KumbhEvent {
  id: string;
  code?: string;
  name: string;
  type?: string;
  date: string;
  start: string;
  peak: string;
  end: string;
  expectedCrowd: number;
  affectedZoneIds: string[];
  published: boolean;
  notes: string;
  status?: string;
}

export interface Volunteer {
  id: string;
  code?: string;
  name: string;
  zoneId: string;
  languages: string[];
  skills: string[];
  status: "AVAILABLE" | "ASSIGNED" | "OFFLINE";
  assignment?: string | undefined;
  lastActiveMinutesAgo: number;
  point: GeoPoint;
}

export type AlertSeverity = "INFORMATION" | "INFO" | "WARNING" | "HIGH" | "CRITICAL";
export type AlertState = "ACTIVE" | "SCHEDULED" | "SENT" | "EXPIRED" | "DRAFT" | "ACKNOWLEDGED" | "RESOLVED";

export interface OpsAlert {
  id: string;
  code?: string;
  title: string;
  message: string;
  type: "CROWD" | "FOOD" | "ROUTE" | "FACILITY" | "GENERAL";
  severity: AlertSeverity;
  audience: string[];
  zoneId?: string | undefined;
  state: AlertState;
  createdMinutesAgo: number;
  point?: GeoPoint | undefined;
}

export interface AppUser {
  id: string;
  name: string;
  role:
    | "Super Admin"
    | "Operations Head"
    | "Crowd Operator"
    | "Food Operator"
    | "Facilities Operator"
    | "Content Manager"
    | "Volunteer Coordinator"
    | "Pilgrim"
    | "Volunteer"
    | "Kitchen Operator"
    | "Donor";
  group: "PILGRIM" | "VOLUNTEER" | "KITCHEN" | "DONOR" | "ADMIN";
  email: string;
  status: "ACTIVE" | "SUSPENDED" | "INVITED";
  lastActive: string;
  created: string;
}

export interface AuditEntry {
  id: string;
  time: string;
  actor: string;
  role: string;
  module: string;
  object: string;
  action: string;
  previousState: string;
  newState: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  reason: string;
}

export interface ActivityEntry {
  id: string;
  time: string;
  actor: string;
  module: string;
  action: string;
  status: "COMPLETED" | "PENDING" | "FAILED";
}

export interface DashboardStats {
  activePilgrims: number;
  peakZones: number;
  foodAlerts: number;
  parkingOccupancy: number;
  activeVolunteers: number;
  staleReports: number;
}

export interface Recommendation {
  id: string;
  title: string;
  reason: string;
  impact: string;
  module: string;
}

export interface SeriesPoint {
  label: string;
  value: number;
  secondary?: number;
}

/* ----------------- Supabase Observation & Operational Records ----------------- */

export interface CrowdObservation {
  id: string;
  zone_id: string;
  crowd_level: CrowdLevel;
  density_score: number;
  estimated_people: number;
  trend: Trend;
  confidence: Confidence;
  observed_at: string;
  source: string;
  verified: boolean;
  created_at?: string;
}

export interface FoodObservation {
  id: string;
  kitchen_id: string;
  food_item: string;
  meals_available: number;
  estimated_demand: number;
  availability: "AVAILABLE" | "LIMITED" | "OUT_OF_STOCK";
  reference_price: number;
  observed_price: number;
  queue_minutes: number;
  status: OpStatus;
  observed_at: string;
  source: string;
  verified: boolean;
  created_at?: string;
}

export interface ParkingObservation {
  id: string;
  parking_id: string;
  available_spaces: number;
  occupied_spaces: number;
  occupancy_percent: number;
  queue_minutes: number;
  trend: Trend;
  status: "AVAILABLE" | "LIMITED" | "FULL" | "CLOSED";
  observed_at: string;
  source: string;
  verified: boolean;
  created_at?: string;
}

export interface FacilityObservation {
  id: string;
  facility_id: string;
  status: "OPEN" | "NEEDS_ATTENTION" | "CLOSED";
  queue_level: CrowdLevel;
  wait_minutes: number;
  working_status: string;
  observed_at: string;
  source: string;
  verified: boolean;
  created_at?: string;
}

export interface RouteObservation {
  id: string;
  route_id: string;
  status: RouteStatus;
  crowd_level: CrowdLevel;
  walking_minutes: number;
  observed_at: string;
  source: string;
  verified: boolean;
  created_at?: string;
}

/* ======================= GUIDANCE ENGINE TYPES ======================= */

/** Discriminator: classifies the source of a guidance item */
export type GuidanceTier = "AUTOMATED" | "VERIFIED" | "OVERRIDE";

/** Modules the guidance engine monitors */
export type GuidanceModule = "CROWD" | "PARKING" | "FACILITY" | "ROUTE" | "FOOD";

/** Actions the engine can take when a rule fires */
export type GuidanceActionType =
  | "RECOMMEND_ALTERNATE"
  | "GENERATE_WARNING"
  | "DEPRIORITIZE"
  | "NEVER_RECOMMEND"
  | "ESCALATE_ADMIN";

/** Override directives issued by authorities */
export type GuidanceOverrideType =
  | "FORCE_CLOSE"
  | "FORCE_OPEN"
  | "SUPPRESS_AUTO_GUIDANCE"
  | "FORCE_RECOMMEND";

export type GuidanceStatus = "ACTIVE" | "SUPERSEDED" | "PROMOTED_TO_VERIFIED" | "DISMISSED";

/** A configurable threshold rule evaluated by the Guidance Engine */
export interface GuidanceRule {
  id: string;
  code: string;
  name: string;
  module: GuidanceModule;
  conditionMetric: string;
  operator: string;
  thresholdValue: number;
  durationSeconds: number;
  actionType: GuidanceActionType;
  severity: AlertSeverity;
  description?: string;
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** A guidance item generated automatically by the engine */
export interface AutomatedGuidance {
  id: string;
  code: string;
  ruleId?: string;
  sourceModule: GuidanceModule;
  entityType: string;
  entityId: string;
  title: string;
  guidanceText: string;
  reason: string;
  recommendedAction?: string;
  status: GuidanceStatus;
  confidence: Confidence;
  severity: AlertSeverity;
  metricSnapshot?: Record<string, unknown>;
  zoneId?: string;
  generatedAt: string;
  expiresAt?: string;
  dismissedAt?: string;
  dismissedBy?: string;
  promotedAdvisoryId?: string;
}

/** A tactical override issued by an administrator or authority */
export interface GuidanceOverride {
  id: string;
  code: string;
  entityType: string;
  entityId: string;
  overrideType: GuidanceOverrideType;
  reason: string;
  authorizedBy: string;
  authorityRole?: string;
  active: boolean;
  zoneId?: string;
  expiresAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** An individual step in the engine's decision trace */
export interface DecisionTrace {
  entityType: string;
  entityId: string;
  entityName: string;
  tier: GuidanceTier;
  status: "SELECTED" | "REJECTED" | "OVERRIDDEN";
  reason: string;
}

/** Final output of the Decision Engine for a given context */
export interface ResolvedGuidance {
  id: string;
  title: string;
  guidanceText: string;
  tier: GuidanceTier;
  severity: AlertSeverity;
  selectedEntityId: string;
  selectedEntityName: string;
  traces: DecisionTrace[];
  generatedAt: string;
}
