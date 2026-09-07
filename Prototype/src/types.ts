export type RouteTier = 1 | 2 | 3 | 4;
// 1: 🔴 Tactical override (police emergency order)
// 2: 🔵 Verified advisory (official police/admin notice)
// 3: 🟡 Automated guidance (live sensors/IoT)
// 4: ⚪ Normal status (standard operation)

export type CrowdLevel = 'low' | 'moderate' | 'high' | 'surge';

export interface LocationPoint {
  id: string;
  name: string;
  name_hi: string;
  name_mr: string;
  lat: number;
  lng: number;
  type: 'parking' | 'ghat' | 'temple' | 'facility';
}

export interface RouteStatus {
  route_id: string;
  name: string;
  name_hi: string;
  name_mr: string;
  destination: string;
  from_location: string;
  to_location: string;
  tier: RouteTier;
  crowd: CrowdLevel;
  message_en: string;
  message_hi: string;
  message_mr: string;
  updated_by: string;
  updated_at: string;
  travel_time_min: number;
  is_closed: boolean;
  color_code?: string;
  closure_reason?: string;
  waypoints?: [number, number][];
}

export interface ParkingLot {
  id: string;
  name: string;
  name_hi: string;
  name_mr: string;
  lat: number;
  lng: number;
  availability_pct: number;
  distance_to_ghat_m: number;
  recommended_for: string[];
  status: 'available' | 'filling_fast' | 'almost_full';
}

export interface Facility {
  id: string;
  name: string;
  name_hi: string;
  name_mr: string;
  lat: number;
  lng: number;
  type: 'toilet' | 'water' | 'medical' | 'helpdesk';
  status: 'clean' | 'moderate' | 'cleaning';
  distance_m: number;
  queue_min: number;
  last_verified_min_ago: number;
  location_detail: string;
  location_detail_hi: string;
  location_detail_mr: string;
  accessible: boolean;
}

export interface FoodSpot {
  id: string;
  name: string;
  name_hi: string;
  name_mr: string;
  lat: number;
  lng: number;
  type: 'free_langar' | 'subsidized_thali' | 'tea_snacks';
  distance_m: number;
  queue_min: number;
  reference_price_inr: number;
  items_en: string;
  items_hi: string;
  items_mr: string;
  last_verified_min_ago: number;
}

export type SupportedLanguage = 'hi' | 'mr' | 'en';

export interface AgentResponse {
  type: 'journey' | 'facility' | 'food' | 'advisory' | 'reroute';
  language: SupportedLanguage;
  title: string;
  summary: string;
  speak_text: string;
  primary_metric: string;
  primary_metric_label: string;
  route_data?: {
    primary_route: RouteStatus;
    alternative_route?: RouteStatus;
    parking?: ParkingLot;
    steps: string[];
    is_diverted?: boolean;
    detour_reason?: string;
  };
  facility_data?: Facility[];
  food_data?: FoodSpot[];
  advisories?: RouteStatus[];
  timestamp: string;
}

export interface RealtimeEvent {
  type: 'ROUTE_UPDATE' | 'TACTICAL_OVERRIDE' | 'RESET_ALL';
  route: RouteStatus;
  previous_tier?: RouteTier;
  timestamp: string;
}

export interface GroupProfile {
  partySize: number;
  hasSeniors: boolean;
  hasChildren: boolean;
  incomingHighway: 'MUMBAI_NH3' | 'DHULE_NH3' | 'PUNE_NH50';
  assignedParking: string;
}

export interface MultimodalLeg {
  id: string;
  leg_type: 'parking' | 'transit_shuttle' | 'walk' | 'visit' | 'return_parking';
  title: string;
  title_hi: string;
  title_mr: string;
  subtitle: string;
  duration_min: number;
  cost_inr: number;
  is_active: boolean;
  is_completed: boolean;
  badge?: string;
}

export interface HeritagePoi {
  id: string;
  name: string;
  name_hi: string;
  name_mr: string;
  distance_m: number;
  lat: number;
  lng: number;
  audio_announcement: {
    en: string;
    hi: string;
    mr: string;
  };
  description: string;
}

export interface SimulationState {
  isPlaying: boolean;
  speed: 1 | 5 | 20;
  progressPct: number; // 0 - 100
  currentStepIndex: number;
  activePoiNear?: HeritagePoi;
}

